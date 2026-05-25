"""
Pack tiles_extracted/{z}/{x}/{y}.png into uttarakhand_chardham.mbtiles

Use this when generate_mbtiles.py was blocked by OSM (403 tiles saved as PNG).
Your tiles_extracted/ folder already has valid PNGs — this script rebuilds MBTiles.

Usage (from backend/assets):
    python build_mbtiles_from_tiles.py

Output:
    uttarakhand_chardham.mbtiles  (overwrite)
"""

import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
INPUT_DIR = SCRIPT_DIR / "tiles_extracted"
OUTPUT_FILE = SCRIPT_DIR / "uttarakhand_chardham.mbtiles"

# OSM 403 block page saved as PNG during bulk download (all tiles same size)
BLOCKED_TILE_SIZE = 6987


def xyz_to_tms(y: int, z: int) -> int:
    return (2**z - 1) - y


def is_valid_png(data: bytes) -> bool:
    if len(data) < 500:
        return False
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return False
    if len(data) == BLOCKED_TILE_SIZE:
        return False
    if b"Access blocked" in data or b"osm.wiki/Blocked" in data:
        return False
    return True


def init_db(path: Path) -> sqlite3.Connection:
    if path.exists():
        path.unlink()
    conn = sqlite3.connect(path)
    conn.execute(
        """
        CREATE TABLE metadata (name TEXT NOT NULL, value TEXT NOT NULL)
        """
    )
    conn.execute(
        """
        CREATE TABLE tiles (
            zoom_level INTEGER NOT NULL,
            tile_column INTEGER NOT NULL,
            tile_row INTEGER NOT NULL,
            tile_data BLOB NOT NULL,
            PRIMARY KEY (zoom_level, tile_column, tile_row)
        )
        """
    )
    meta = [
        ("name", "Uttarakhand Chardham Offline Map"),
        ("type", "baselayer"),
        ("version", "2"),
        ("description", "Raster PNG from tiles_extracted (valid OSM tiles)"),
        ("format", "png"),
        ("minzoom", "8"),
        ("maxzoom", "16"),
        ("bounds", "77.5,28.5,81.0,31.5"),
        ("center", "79.0,30.5,10"),
        ("attribution", "© OpenStreetMap contributors"),
        ("generated", datetime.utcnow().isoformat()),
    ]
    conn.executemany("INSERT INTO metadata VALUES (?,?)", meta)
    conn.commit()
    return conn


def main() -> None:
    if not INPUT_DIR.is_dir():
        print(f"ERROR: Missing folder {INPUT_DIR}")
        sys.exit(1)

    conn = init_db(OUTPUT_FILE)
    batch = []
    written = 0
    skipped = 0

    for z_dir in sorted(INPUT_DIR.iterdir(), key=lambda p: int(p.name)):
        if not z_dir.is_dir():
            continue
        z = int(z_dir.name)
        for x_dir in sorted(z_dir.iterdir(), key=lambda p: int(p.name)):
            if not x_dir.is_dir():
                continue
            x = int(x_dir.name)
            for tile_file in x_dir.glob("*.png"):
                y = int(tile_file.stem)
                data = tile_file.read_bytes()
                if not is_valid_png(data):
                    skipped += 1
                    continue
                tms_y = xyz_to_tms(y, z)
                batch.append((z, x, tms_y, sqlite3.Binary(data)))
                if len(batch) >= 500:
                    conn.executemany("INSERT INTO tiles VALUES (?,?,?,?)", batch)
                    conn.commit()
                    written += len(batch)
                    batch = []
                    print(f"\r  {written:,} tiles packed…", end="", flush=True)

    if batch:
        conn.executemany("INSERT INTO tiles VALUES (?,?,?,?)", batch)
        conn.commit()
        written += len(batch)

    conn.execute("VACUUM")
    conn.close()

    size_mb = OUTPUT_FILE.stat().st_size / 1024 / 1024
    print(f"\nDone: {written:,} tiles -> {OUTPUT_FILE.name} ({size_mb:.1f} MB)")
    if skipped:
        print(f"Skipped invalid/blocked: {skipped}")
    print("\nNext: restart backend, re-download map in the app.")


if __name__ == "__main__":
    main()
