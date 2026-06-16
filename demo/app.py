from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import torch
import cv2
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static',
            template_folder='templates')
CORS(app)

# Load model
try:
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='model/best.pt', force_reload=False)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Read image
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Run inference
        results = model(img_array)
        
        # Get predictions
        predictions = results.pred[0]  # predictions (tensor, shape(n,6), x1,y1,x2,y2,conf,cls)
        
        # Draw bounding boxes
        annotated_image = results.render()[0]
        
        # Convert back to PIL Image
        result_image = Image.fromarray(annotated_image)
        
        # Convert to base64
        buffered = io.BytesIO()
        result_image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Extract detections
        detections = []
        class_names = model.names
        
        for pred in predictions:
            x1, y1, x2, y2, conf, cls = pred.tolist()
            detections.append({
                'class': class_names[int(cls)],
                'confidence': round(float(conf), 3),
                'bbox': [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]
            })
        
        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'detections': detections,
            'count_person': sum(1 for d in detections if d['class'] == 'person'),
            'count_head': sum(1 for d in detections if d['class'] == 'head')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/classes', methods=['GET'])
def get_classes():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    return jsonify({'classes': model.names})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
