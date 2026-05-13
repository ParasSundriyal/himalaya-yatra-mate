"""
extract_tiles.py
================
Extracts raster tiles from MBTiles into a flat {z}/{x}/{y}.png
folder structure that react-native-maps UrlTile can read via file:// URI.

Why this works when MBTiles direct reading doesn't:
  - UrlTile uses the NATIVE image loader (Fresco/SDWebImage)
  - Native loaders support file:// URIs directly
  - They do NOT support SQLite blobs or custom fetch() interception
  - Flat files = direct disk read = always works

Usage:
    python extract_tiles.py uttarakhand_chardham.mbtiles

Output:
    tiles_extracted/          <- folder ready to zip and host
    tiles_extracted.zip       <-mbtiles upload this to backend/assets/

Then in your app:
    UrlTile urlTemplate={`file://${tilesDir}/{z}/{x}/{y}.png`}
"""

import sqlite3
import os
import sys
import zipfile
from pathlib import Path

INPUT_FILE   = "uttarakhand_chardham.mbtiles"
OUTPUT_DIR   = "tiles_extracted"
OUTPUT_ZIP   = "tiles_extracted.zip"

def tms_to_xyz_y(tms_row, zoom):
    """Convert TMS row back to XYZ y for folder naming."""
    return (2 ** zoom - 1) - tms_row

def extract(mbtiles_path, output_dir):
    print(f"Opening: {mbtiles_path}")
    conn = sqlite3.connect(mbtiles_path)

    # Verify raster format
    fmt = conn.execute("SELECT value FROM metadata WHERE name='format'").fetchone()
    if fmt and fmt[0].lower() == 'pbf':
        print("ERROR: This is a vector MBTiles (PBF). Run generate_mbtiles_fast.py first.")
        conn.close()
        sys.exit(1)

    total = conn.execute("SELECT COUNT(*) FROM tiles").fetchone()[0]
    print(f"Total tiles to extract: {total:,}")

    if total == 0:
        print("ERROR: No tiles found in database.")
        conn.close()
        sys.exit(1)

    # Get zoom range info
    minz = conn.execute("SELECT MIN(zoom_level) FROM tiles").fetchone()[0]
    maxz = conn.execute("SELECT MAX(zoom_level) FROM tiles").fetchone()[0]
    print(f"Zoom range: {minz} – {maxz}")

    Path(output_dir).mkdir(exist_ok=True)

    extracted = 0
    skipped   = 0

    cursor = conn.execute(
        "SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles"
    )

    for row in cursor:
        z, x, tms_row, data = row

        # Convert TMS row → XYZ y (folder uses XYZ convention)
        y = tms_to_xyz_y(tms_row, z)

        # Build path: tiles_extracted/{z}/{x}/{y}.png
        tile_dir  = os.path.join(output_dir, str(z), str(x))
        tile_path = os.path.join(tile_dir, f"{y}.png")

        os.makedirs(tile_dir, exist_ok=True)

        # Skip if already exists (resume support)
        if os.path.exists(tile_path):
            skipped += 1
        else:
            with open(tile_path, 'wb') as f:
                f.write(bytes(data) if isinstance(data, memoryview) else data)
            extracted += 1

        extracted_total = extracted + skipped
        if extracted_total % 5000 == 0:
            pct = extracted_total / total * 100
            print(f"\r  {pct:5.1f}%  {extracted_total:,}/{total:,} "
                  f"(written:{extracted} skipped:{skipped})", end="", flush=True)

    conn.close()
    print(f"\n\nDone. Extracted: {extracted:,}  Skipped (already existed): {skipped:,}")

    # Count actual files written
    written_count = sum(
        len(files) for _, _, files in os.walk(output_dir)
    )
    size_mb = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, files in os.walk(output_dir)
        for f in files
    ) / 1024 / 1024
    print(f"Total files: {written_count:,}  |  Total size: {size_mb:.1f} MB")
    return extracted, size_mb

def create_zip(output_dir, zip_path):
    print(f"\nCreating zip: {zip_path}")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        written = 0
        for root, dirs, files in os.walk(output_dir):
            for file in files:
                full_path = os.path.join(root, file)
                arc_name  = os.path.relpath(full_path, output_dir)
                zf.write(full_path, arc_name)
                written += 1
                if written % 5000 == 0:
                    print(f"\r  Zipping: {written:,} files...", end="", flush=True)

    zip_size = os.path.getsize(zip_path) / 1024 / 1024
    print(f"\nZip created: {zip_path}  ({zip_size:.1f} MB)")
    return zip_size

if __name__ == "__main__":
    source = sys.argv[1] if len(sys.argv) > 1 else INPUT_FILE

    if not os.path.exists(source):
        print(f"ERROR: File not found: {source}")
        sys.exit(1)

    extracted, size_mb = extract(source, OUTPUT_DIR)
    zip_size = create_zip(OUTPUT_DIR, OUTPUT_ZIP)

    print("\n" + "=" * 56)
    print("NEXT STEPS:")
    print("=" * 56)
    print(f"1. Copy {OUTPUT_ZIP} to  backend/assets/tiles_extracted.zip")
    print(f"2. In Express server, add route:")
    print(f"   GET /api/maps/tiles.zip  → stream tiles_extracted.zip")
    print(f"3. App downloads tiles.zip (~{zip_size:.0f}MB),")
    print(f"   unzips to FileSystem.documentDirectory + 'tiles/'")
    print(f"4. UrlTile urlTemplate:")
    print(f"   file://${{tilesDir}}/{{z}}/{{x}}/{{y}}.png")
    print("=" * 56)