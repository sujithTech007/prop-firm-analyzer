import io
import pandas as pd
from typing import Tuple

# Mapping of normalized target column -> list of acceptable lowercase/stripped alias suffixes
COLUMN_ALIASES = {
    "open_time": ["opentime", "opentime", "time", "date", "executiontime", "dealtime", "positionopentime", "created"],
    "close_time": ["closetime", "exittime", "closed", "positionclosetime", "close", "endtime"],
    "symbol": ["symbol", "pair", "instrument", "ticker", "asset", "currency", "item"],
    "direction": ["direction", "type", "action", "cmd", "buysell", "side", "tradetype"],
    "lot_size": ["lotsize", "lots", "volume", "size", "qty", "quantity", "lot"],
    "profit": ["profit", "pnl", "gain", "netprofit", "amount", "income", "realizedpnl", "netpnl"]
}

def clean_column_name(col: str) -> str:
    """Normalize column names by lowercasing, stripping spaces, underscores, and dashes."""
    return col.lower().replace(" ", "").replace("_", "").replace("-", "")

def parse_trades_csv(csv_content: str) -> pd.DataFrame:
    """
    Forgivingly parses a CSV string containing historical trade records.
    Automatically sniffs the delimiter and skips potential metadata header rows.
    Normalizes column names, filters out balance transactions, formats datetimes,
    sorts chronologically, and computes cumulative P&L.
    """
    lines = csv_content.splitlines()
    header_idx = 0
    sep = ','
    found_header = False

    # Standard clean function matching COLUMN_ALIASES
    def clean_col(name: str) -> str:
        return clean_column_name(name)

    # Search lines to locate the header row and sniff delimiter
    for idx, line in enumerate(lines):
        striped_line = line.strip()
        if not striped_line:
            continue
        
        # Test common separators
        for possible_sep in [',', ';', '\t']:
            tokens = [clean_col(t) for t in striped_line.split(possible_sep)]
            
            # Check if this row contains standard close_time and profit aliases
            has_close_time = any(clean_col(alias) in tokens for alias in COLUMN_ALIASES["close_time"])
            has_profit = any(clean_col(alias) in tokens for alias in COLUMN_ALIASES["profit"])
            has_symbol = any(clean_col(alias) in tokens for alias in COLUMN_ALIASES["symbol"])
            
            # A valid header must have at least close_time and profit, or symbol and profit
            if (has_close_time and has_profit) or (has_symbol and has_profit):
                header_idx = idx
                sep = possible_sep
                found_header = True
                break
        if found_header:
            break

    # Reconstruct CSV from detected header downwards
    cleaned_csv = "\n".join(lines[header_idx:])

    # Load CSV using pandas
    try:
        df = pd.read_csv(io.StringIO(cleaned_csv), sep=sep)
    except Exception as e:
        raise ValueError(f"Failed to read CSV format: {str(e)}")

    if df.empty:
        raise ValueError("Uploaded CSV file is empty or no data could be parsed.")

    # Match columns
    normalized_cols = {}
    cleaned_df_cols = {clean_column_name(col): col for col in df.columns}

    for target_col, aliases in COLUMN_ALIASES.items():
        matched_original = None
        # Try exact clean name match
        clean_target = clean_column_name(target_col)
        if clean_target in cleaned_df_cols:
            matched_original = cleaned_df_cols[clean_target]
        else:
            # Try aliases
            for alias in aliases:
                clean_alias = clean_column_name(alias)
                if clean_alias in cleaned_df_cols:
                    matched_original = cleaned_df_cols[clean_alias]
                    break
        
        if matched_original:
            normalized_cols[matched_original] = target_col

    # Rename matched columns
    df = df.rename(columns=normalized_cols)

    # Check for crucial columns
    required_cols = ["profit", "close_time"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(
            f"Could not map required columns: {', '.join(missing_cols)}. "
            "Please ensure your CSV contains headers for Close Time and Profit/PnL."
        )

    # Filter out balance operations (deposits/withdrawals) before adding default columns
    # Balance transactions usually contain keywords in the symbol or direction column, or have empty symbols.
    balance_keywords = {"balance", "deposit", "withdrawal", "credit", "reversal", "bonus", "adjust", "transfer", "interest", "rebate"}
    
    if "symbol" in df.columns:
        df = df.dropna(subset=["symbol"])
        df = df[~df["symbol"].astype(str).str.lower().str.strip().isin(balance_keywords)]
        df = df[df["symbol"].astype(str).str.strip().ne("")]
        
    if "direction" in df.columns:
        df = df[~df["direction"].astype(str).str.lower().str.strip().isin(balance_keywords)]

    if df.empty:
        raise ValueError("No valid trading logs found. Ensure balance lines are distinct from actual trades.")

    # Handle defaults for optional columns if they aren't found
    if "open_time" not in df.columns:
        # Fall back to close_time if open_time is missing
        df["open_time"] = df["close_time"]
    if "symbol" not in df.columns:
        df["symbol"] = "UNKNOWN"
    if "direction" not in df.columns:
        df["direction"] = "buy"
    if "lot_size" not in df.columns:
        df["lot_size"] = 0.1

    # Convert datetimes
    df["close_time"] = pd.to_datetime(df["close_time"], errors="coerce")
    df["open_time"] = pd.to_datetime(df["open_time"], errors="coerce")

    # If any crucial close_time parsing failed, drop or fill
    df = df.dropna(subset=["close_time"])
    if df.empty:
        raise ValueError("No valid Close Time values could be parsed in the CSV.")

    # Fill NaNs for numeric types
    df["profit"] = pd.to_numeric(df["profit"], errors="coerce").fillna(0.0)
    df["lot_size"] = pd.to_numeric(df["lot_size"], errors="coerce").fillna(0.1)
    df["symbol"] = df["symbol"].astype(str).fillna("UNKNOWN")
    df["direction"] = df["direction"].astype(str).fillna("buy")

    # Sort by close time to ensure chronological performance tracking
    df = df.sort_values(by="close_time").reset_index(drop=True)

    # Compute running cumulative P&L
    df["cumulative_pnl"] = df["profit"].cumsum()

    return df
