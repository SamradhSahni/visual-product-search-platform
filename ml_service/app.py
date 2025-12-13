# ml_service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import clip
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 8200))

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)


def normalize(vec):
    norm = np.linalg.norm(vec)
    return (vec / norm).tolist() if norm > 0 else vec.tolist()


@app.route("/health", methods=["GET"])
def health():
    return jsonify(success=True)


@app.route("/embed-image", methods=["POST"])
def embed_image():
    if "image" not in request.files:
        return jsonify(success=False, message="Image required"), 400

    image_bytes = request.files["image"].read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        embedding = model.encode_image(image_input)
        embedding = embedding.cpu().numpy()[0]

    return jsonify(
        success=True,
        embedding=normalize(embedding)
    )


@app.route("/search", methods=["POST"])
def search():
    data = request.json
    query = np.array(data["embedding"])
    items = data.get("items") or []
    k = int(request.args.get("k", 12))

    scored = []
    for item in items:
        emb = np.array(item["embedding"])
        score = float(np.dot(query, emb))
        scored.append({
            "productId": item.get("productId") or item.get("id"),
            "score": score
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return jsonify(success=True, results=[scored[:k]])


if __name__ == "__main__":
    print("CLIP ML service running on port", PORT)
    app.run(host="0.0.0.0", port=PORT)
