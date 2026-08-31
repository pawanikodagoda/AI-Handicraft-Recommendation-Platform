import os
import sqlite3
import random

directory = "storage/app/public/products"

# Define the good images we know are valid products
good_images = [
    "blue-heart-charm.jpg",
    "gold-chain-bangle.jpg",
    "pearl-strand.jpg",
    "rose-gold-infinity.jpg",
    "silver-crystal.jpg",
    "brass_leather_1788136980262.png",
    "emerald_green_1788136935433.png",
    "galle_fort_pearl_1788137001870.png",
    "hammered_silver_1788136947303.png",
    "heritage_gold_1788136902783.png",
    "kandyan_rose_1788136924729.png",
    "ocean_sapphire_1788137012943.png",
    "oxidized_black_1788136959349.png",
    "pink_coral_1788137033520.png",
    "ruby_encrusted_1788136914110.png",
    "sea_glass_1788137023519.png",
    "twin_dragon_1788136992052.png"
]

# Delete bad images
all_files = os.listdir(directory)
for f in all_files:
    if f not in good_images and f != "ceycrafts_hero_banner_1788133564563.png":
        path = os.path.join(directory, f)
        if os.path.isfile(path):
            os.remove(path)
            print(f"Deleted {f}")

# Update database
conn = sqlite3.connect('database/database.sqlite')
c = conn.cursor()

c.execute("SELECT id FROM products ORDER BY id ASC")
products = c.fetchall()

# Map the 17 good images over the 24 products (some will have to repeat)
for i, row in enumerate(products):
    pid = row[0]
    img_filename = good_images[i % len(good_images)]
    img_path = f"products/{img_filename}"
    img_json = f'["{img_path}"]'
    c.execute("UPDATE products SET images = ?, bracelet_image_path = ? WHERE id = ?", (img_json, img_path, pid))

conn.commit()
conn.close()
print("Successfully fixed the database with the correct images!")
