from PIL import Image

def create_image(path, size, color):
    """Creates a solid color image and saves it to the specified path."""
    img = Image.new('RGB', size, color)
    img.save(path)
    print(f"Created {path} ({size[0]}x{size[1]}) with color {color}")

# Define assets and their properties
assets = [
    # Environment
    ("assets/images/background.png", (800, 600), "darkblue"),
    ("assets/images/ground_platform.png", (200, 50), "gray"),
    ("assets/images/safe_zone.png", (200, 50), "lime"),
    
    # Player and Interactables
    ("assets/images/player.png", (50, 50), "yellow"),
    ("assets/images/switch.png", (30, 30), "red"),
    ("assets/images/zombie.png", (60, 60), "green"),
    
    # Blocks (Square, 50x50 for simplicity)
    ("assets/images/block_red.png", (50, 50), "red"),
    ("assets/images/block_orange.png", (50, 50), "orange"),
    ("assets/images/block_yellow.png", (50, 50), "yellow"),
    ("assets/images/block_green.png", (50, 50), "darkgreen"),
]

# Create images
for path, size, color in assets:
    create_image(f"zombie_bridge/{path}", size, color)

print("All placeholder images generated.")
