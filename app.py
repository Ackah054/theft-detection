from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import base64
import io
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
import random
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)

MODEL_PATH = 'theft_detection_model.h5'
model = None

def load_theft_model():
    """Load the theft detection model"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = load_model(MODEL_PATH)
            print(f"✅ Theft detection model loaded successfully from {MODEL_PATH}")
            return True
        else:
            print(f"❌ Model file not found: {MODEL_PATH}")
            print("📝 Using mock detection instead")
            return False
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        print("📝 Using mock detection instead")
        return False

def preprocess_image(image_data):
    """Preprocess image for model prediction"""
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size (adjust based on your model requirements)
        image = image.resize((224, 224))  # Common size, adjust as needed
        
        # Convert to numpy array and normalize
        image_array = np.array(image) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}")
        return None

def predict_theft(image_array):
    """Make prediction using the loaded model"""
    global model
    try:
        if model is None:
            return None
        
        prediction = model.predict(image_array)
        
        # Assuming binary classification (theft/no theft)
        # Adjust based on your model's output format
        if len(prediction.shape) > 1 and prediction.shape[1] > 1:
            # Multi-class output
            theft_probability = prediction[0][1]  # Assuming index 1 is theft class
        else:
            # Binary output
            theft_probability = prediction[0][0]
        
        confidence = int(theft_probability * 100)
        violence_detected = theft_probability > 0.5  # Threshold for detection
        
        return {
            'violence_detected': violence_detected,
            'confidence': confidence,
            'raw_prediction': float(theft_probability)
        }
    except Exception as e:
        print(f"Error making prediction: {str(e)}")
        return None

# Mock database for alerts
alerts_db = []

# Initialize with some sample alerts
def init_sample_alerts():
    global alerts_db
    sample_alerts = [
        {
            "id": str(uuid.uuid4()),
            "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat(),
            "type": "theft",
            "severity": "high",
            "confidence": 87,
            "location": "Camera 2 - Aisle 3",
            "description": "Suspicious activity detected - person concealing item",
            "status": "active",
            "metadata": {
                "cameraId": "cam_002",
                "videoUrl": "/static/sample_video.mp4"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "type": "suspicious",
            "severity": "medium",
            "confidence": 72,
            "location": "Camera 1 - Entrance",
            "description": "Potential theft activity - item removal without payment",
            "status": "acknowledged",
            "metadata": {
                "cameraId": "cam_001"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "timestamp": (datetime.now() - timedelta(hours=5)).isoformat(),
            "type": "theft",
            "severity": "high",
            "confidence": 91,
            "location": "Camera 3 - Electronics",
            "description": "High confidence theft detection - concealment behavior",
            "status": "resolved",
            "metadata": {
                "cameraId": "cam_003"
            }
        }
    ]
    alerts_db.extend(sample_alerts)

# Initialize sample data
init_sample_alerts()

# Routes for serving pages
@app.route('/')
def dashboard():
    stats = {
        'totalCameras': 4,
        'activeCameras': 3,
        'alertsToday': len([a for a in alerts_db if a['status'] == 'active']),
        'detectionAccuracy': 94.2
    }
    recent_alerts = sorted(alerts_db, key=lambda x: x['timestamp'], reverse=True)[:3]
    return render_template('dashboard.html', stats=stats, recent_alerts=recent_alerts)

@app.route('/live-monitor')
def live_monitor():
    return render_template('live_monitor.html')

@app.route('/video-upload')
def video_upload():
    return render_template('video_upload.html')

@app.route('/alerts')
def alerts_page():
    return render_template('alerts.html')

# API Routes
@app.route('/api/detect-frame', methods=['POST'])
def detect_frame():
    """Analyze a single frame for theft detection"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        if model is not None:
            # Preprocess image for model
            processed_image = preprocess_image(image_data)
            
            if processed_image is not None:
                # Make prediction using real model
                prediction_result = predict_theft(processed_image)
                
                if prediction_result is not None:
                    violence_detected = prediction_result['violence_detected']
                    confidence = prediction_result['confidence']
                    threat_level = "High" if confidence > 80 else "Medium" if confidence > 60 else "Low"
                    
                    result = {
                        'violence_detected': violence_detected,
                        'confidence': confidence,
                        'threat_level': threat_level,
                        'timestamp': datetime.now().isoformat(),
                        'model_used': True
                    }
                else:
                    # Fallback to mock if prediction fails
                    violence_detected = random.random() < 0.15
                    confidence = random.randint(65, 95) if violence_detected else random.randint(10, 40)
                    threat_level = "High" if confidence > 80 else "Medium" if confidence > 60 else "Low"
                    
                    result = {
                        'violence_detected': violence_detected,
                        'confidence': confidence,
                        'threat_level': threat_level,
                        'timestamp': datetime.now().isoformat(),
                        'model_used': False,
                        'fallback_reason': 'Prediction failed'
                    }
            else:
                # Fallback to mock if preprocessing fails
                violence_detected = random.random() < 0.15
                confidence = random.randint(65, 95) if violence_detected else random.randint(10, 40)
                threat_level = "High" if confidence > 80 else "Medium" if confidence > 60 else "Low"
                
                result = {
                    'violence_detected': violence_detected,
                    'confidence': confidence,
                    'threat_level': threat_level,
                    'timestamp': datetime.now().isoformat(),
                    'model_used': False,
                    'fallback_reason': 'Image preprocessing failed'
                }
        else:
            # Use mock detection if model not loaded
            violence_detected = random.random() < 0.15
            confidence = random.randint(65, 95) if violence_detected else random.randint(10, 40)
            threat_level = "High" if confidence > 80 else "Medium" if confidence > 60 else "Low"
            
            result = {
                'violence_detected': violence_detected,
                'confidence': confidence,
                'threat_level': threat_level,
                'timestamp': datetime.now().isoformat(),
                'model_used': False,
                'fallback_reason': 'Model not loaded'
            }
        
        # If theft detected with high confidence, add to alerts
        if result['violence_detected'] and result['confidence'] > 70:
            new_alert = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "type": "theft",
                "severity": "high" if result['confidence'] > 80 else "medium",
                "confidence": result['confidence'],
                "location": "Live Camera Feed",
                "description": f"Real-time theft detection - confidence {result['confidence']}%",
                "status": "active",
                "metadata": {
                    "cameraId": "live_cam",
                    "realtime": True,
                    "model_used": result.get('model_used', False)
                }
            }
            alerts_db.append(new_alert)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-video', methods=['POST'])
def analyze_video():
    """Analyze uploaded video file"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        # Mock video analysis - in real implementation, process the video
        # Simulate analysis results
        mock_results = {
            'totalFrames': random.randint(1500, 3000),
            'processedFrames': 0,  # Will be updated during processing
            'detections': [
                {
                    'timestamp': 45.2,
                    'confidence': 87,
                    'detected': True,
                    'description': 'Suspicious behavior detected - person concealing item'
                },
                {
                    'timestamp': 127.8,
                    'confidence': 72,
                    'detected': True,
                    'description': 'Potential theft activity - item removal without payment'
                },
                {
                    'timestamp': 203.5,
                    'confidence': 91,
                    'detected': True,
                    'description': 'High confidence theft detection - concealment behavior'
                }
            ],
            'overallThreatLevel': 'High',
            'averageConfidence': 83,
            'processingTime': random.randint(30, 60)
        }
        
        mock_results['processedFrames'] = mock_results['totalFrames']
        
        # Add alerts for detected incidents
        for detection in mock_results['detections']:
            if detection['confidence'] > 70:
                new_alert = {
                    "id": str(uuid.uuid4()),
                    "timestamp": datetime.now().isoformat(),
                    "type": "theft",
                    "severity": "high" if detection['confidence'] > 80 else "medium",
                    "confidence": detection['confidence'],
                    "location": f"Uploaded Video - {detection['timestamp']}s",
                    "description": detection['description'],
                    "status": "active",
                    "metadata": {
                        "videoFile": video_file.filename,
                        "timestamp": detection['timestamp']
                    }
                }
                alerts_db.append(new_alert)
        
        return jsonify(mock_results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get all alerts with optional filtering"""
    try:
        # Sort alerts by timestamp (newest first)
        sorted_alerts = sorted(alerts_db, key=lambda x: x['timestamp'], reverse=True)
        return jsonify({'alerts': sorted_alerts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['PUT'])
def update_alert(alert_id):
    """Update alert status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['active', 'acknowledged', 'resolved']:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Find and update alert
        for alert in alerts_db:
            if alert['id'] == alert_id:
                alert['status'] = new_status
                return jsonify({'success': True, 'alert': alert})
        
        return jsonify({'error': 'Alert not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Static files route
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    # Create static directory if it doesn't exist
    os.makedirs('static', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    print("🤖 Loading theft detection model...")
    model_loaded = load_theft_model()
    
    print("🚀 ShopGuard AI Detection System Starting...")
    print("📱 Dashboard: http://localhost:5000")
    print("📹 Live Monitor: http://localhost:5000/live-monitor")
    print("📤 Video Upload: http://localhost:5000/video-upload")
    print("🚨 Alerts: http://localhost:5000/alerts")
    
    if model_loaded:
        print("✅ Real-time AI detection enabled")
    else:
        print("⚠️  Using mock detection - place theft_detection_model.h5 in root directory")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
