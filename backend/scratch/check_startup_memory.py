import sys
import os

def print_memory(label):
    try:
        import psutil
        process = psutil.Process(os.getpid())
        mem = process.memory_info().rss / 1024 / 1024
        print(f"[{label}] Memory usage: {mem:.2f} MB")
    except ImportError:
        print(f"[{label}] psutil not installed")

print_memory("Before Imports")

# Import main (which imports all routers)
from main import app

print_memory("After Importing main")

# Check if heavy ML packages are in sys.modules
heavy_packages = ['torch', 'sentence_transformers', 'sklearn', 'langchain', 'faiss', 'spacy']
loaded_heavy = [pkg for pkg in heavy_packages if any(mod.startswith(pkg) for mod in sys.modules)]

print("\nLoaded Heavy Modules:")
if loaded_heavy:
    for pkg in loaded_heavy:
        print(f" - {pkg}")
else:
    print(" - None! Perfect! No heavy ML packages loaded at startup.")
