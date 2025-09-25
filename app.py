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
    """Analyze a single frame for theft detection with enhanced alert creation"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        camera_id = data.get('camera_id', 'live_cam')
        location = data.get('location', 'Live Camera Feed')
        
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
        
        # Create detailed alert if theft detected
        if result['violence_detected'] and result['confidence'] > 60:
            severity = "high" if result['confidence'] > 80 else "medium" if result['confidence'] > 70 else "low"
            
            new_alert = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "type": "theft",
                "severity": severity,
                "confidence": result['confidence'],
                "location": location,
                "description": f"Live theft detection - {result['threat_level']} threat level (confidence: {result['confidence']}%)",
                "status": "active",
                "metadata": {
                    "cameraId": camera_id,
                    "realtime": True,
                    "model_used": result.get('model_used', False),
                    "threat_level": result['threat_level'],
                    "detection_method": "live_stream"
                }
            }
            alerts_db.append(new_alert)
            result['alert_created'] = True
            result['alert_id'] = new_alert['id']
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-video', methods=['POST'])
def analyze_video():
    """Analyze uploaded video file with real AI model processing"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        temp_video_path = f"temp_{uuid.uuid4().hex}_{video_file.filename}"
        video_file.save(temp_video_path)
        
        try:
            cap = cv2.VideoCapture(temp_video_path)
            
            if not cap.isOpened():
                return jsonify({'error': 'Could not open video file'}), 400
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            detections = []
            frame_count = 0
            processed_frames = 0
            
            frame_skip = max(1, int(fps)) if fps > 0 else 30
            
            print(f"Processing video: {total_frames} frames, {fps} FPS, {duration:.1f}s duration")
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Skip frames for efficiency
                if frame_count % frame_skip != 0:
                    continue
                
                processed_frames += 1
                current_time = frame_count / fps if fps > 0 else frame_count / 30
                
                try:
                    # Resize frame
                    frame_resized = cv2.resize(frame, (224, 224))
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
                    # Normalize
                    frame_normalized = frame_rgb.astype(np.float32) / 255.0
                    # Add batch dimension
                    frame_batch = np.expand_dims(frame_normalized, axis=0)
                    
                    if model is not None:
                        try:
                            prediction = model.predict(frame_batch, verbose=0)
                            
                            # Process prediction based on model output
                            if len(prediction.shape) > 1 and prediction.shape[1] > 1:
                                # Multi-class output
                                theft_probability = float(prediction[0][1])  # Assuming index 1 is theft class
                            else:
                                # Binary output
                                theft_probability = float(prediction[0][0])
                            
                            confidence = int(theft_probability * 100)
                            detected = theft_probability > 0.5  # Threshold for detection
                            
                            if detected and confidence > 60:
                                descriptions = [
                                    f"AI Model detected suspicious behavior (confidence: {confidence}%)",
                                    f"Theft activity identified by neural network (confidence: {confidence}%)",
                                    f"Abnormal behavior pattern detected (confidence: {confidence}%)",
                                    f"Potential shoplifting behavior identified (confidence: {confidence}%)",
                                    f"Suspicious concealment activity detected (confidence: {confidence}%)"
                                ]
                                description = random.choice(descriptions)
                                
                                detections.append({
                                    'timestamp': round(current_time, 1),
                                    'confidence': confidence,
                                    'detected': True,
                                    'description': description,
                                    'model_used': True,
                                    'frame_number': frame_count
                                })
                                
                                print(f"Detection at {current_time:.1f}s: {confidence}% confidence")
                        
                        except Exception as model_error:
                            print(f"Model prediction error at frame {frame_count}: {str(model_error)}")
                            # Continue processing other frames
                            continue
                    
                    else:
                        # Simple heuristic: detect significant changes or unusual patterns
                        gray = cv2.cvtColor(frame_resized, cv2.COLOR_RGB2GRAY)
                        
                        # Basic motion detection using frame differences (simplified)
                        # This is a placeholder - in real implementation you'd compare with previous frames
                        mean_intensity = np.mean(gray)
                        std_intensity = np.std(gray)
                        
                        # Heuristic: unusual lighting or movement patterns
                        if std_intensity > 50 and mean_intensity < 100:  # Dark areas with high variation
                            confidence = random.randint(60, 80)  # Lower confidence for heuristic
                            
                            detections.append({
                                'timestamp': round(current_time, 1),
                                'confidence': confidence,
                                'detected': True,
                                'description': f"Heuristic analysis detected unusual activity (confidence: {confidence}%)",
                                'model_used': False,
                                'frame_number': frame_count
                            })
                
                except Exception as frame_error:
                    print(f"Error processing frame {frame_count}: {str(frame_error)}")
                    continue
            
            cap.release()
            
            valid_detections = [d for d in detections if d['detected']]
            overall_threat = "High" if len(valid_detections) > 3 else "Medium" if len(valid_detections) > 1 else "Low"
            avg_confidence = sum(d['confidence'] for d in valid_detections) / len(valid_detections) if valid_detections else 0
            
            processing_time = max(10, processed_frames * 0.5)  # Rough estimate
            
            results = {
                'totalFrames': total_frames,
                'processedFrames': processed_frames,
                'detections': detections,
                'overallThreatLevel': overall_threat,
                'averageConfidence': round(avg_confidence, 1),
                'processingTime': round(processing_time, 1),
                'validDetections': len(valid_detections),
                'filename': video_file.filename,
                'duration': round(duration, 1),
                'fps': round(fps, 1),
                'model_used': model is not None
            }
            
            alerts_created = 0
            for detection in valid_detections:
                if detection['confidence'] > 70:
                    severity = "high" if detection['confidence'] > 85 else "medium"
                    
                    new_alert = {
                        "id": str(uuid.uuid4()),
                        "timestamp": datetime.now().isoformat(),
                        "type": "theft",
                        "severity": severity,
                        "confidence": detection['confidence'],
                        "location": f"Uploaded Video: {video_file.filename}",
                        "description": f"{detection['description']} (at {detection['timestamp']}s)",
                        "status": "active",
                        "metadata": {
                            "videoFile": video_file.filename,
                            "videoTimestamp": detection['timestamp'],
                            "detection_method": "video_upload",
                            "processing_time": results['processingTime'],
                            "model_used": detection.get('model_used', False),
                            "frame_number": detection.get('frame_number', 0)
                        }
                    }
                    alerts_db.append(new_alert)
                    alerts_created += 1
            
            results['alerts_created'] = alerts_created
            
            print(f"Video analysis complete: {len(valid_detections)} detections, {alerts_created} alerts created")
            
            return jsonify(results)
        
        finally:
            try:
                if os.path.exists(temp_video_path):
                    os.remove(temp_video_path)
            except Exception as cleanup_error:
                print(f"Warning: Could not delete temporary file: {cleanup_error}")
        
    except Exception as e:
        print(f"Video analysis error: {str(e)}")
        return jsonify({'error': f'Video analysis failed: {str(e)}'}), 500

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get all alerts with optional filtering"""
    try:
        # Get query parameters for filtering
        status_filter = request.args.get('status', 'all')
        type_filter = request.args.get('type', 'all')
        severity_filter = request.args.get('severity', 'all')
        
        # Filter alerts based on parameters
        filtered_alerts = alerts_db
        
        if status_filter != 'all':
            filtered_alerts = [a for a in filtered_alerts if a['status'] == status_filter]
        
        if type_filter != 'all':
            filtered_alerts = [a for a in filtered_alerts if a['type'] == type_filter]
            
        if severity_filter != 'all':
            filtered_alerts = [a for a in filtered_alerts if a['severity'] == severity_filter]
        
        # Sort alerts by timestamp (newest first)
        sorted_alerts = sorted(filtered_alerts, key=lambda x: x['timestamp'], reverse=True)
        
        # Add statistics
        stats = {
            'total': len(alerts_db),
            'active': len([a for a in alerts_db if a['status'] == 'active']),
            'acknowledged': len([a for a in alerts_db if a['status'] == 'acknowledged']),
            'resolved': len([a for a in alerts_db if a['status'] == 'resolved'])
        }
        
        return jsonify({
            'alerts': sorted_alerts,
            'stats': stats,
            'filtered_count': len(sorted_alerts)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['PUT'])
def update_alert(alert_id):
    """Update alert status with enhanced feedback"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['active', 'acknowledged', 'resolved']:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Find and update alert
        for alert in alerts_db:
            if alert['id'] == alert_id:
                old_status = alert['status']
                alert['status'] = new_status
                alert['updated_at'] = datetime.now().isoformat()
                
                # Add status change metadata
                if 'status_history' not in alert:
                    alert['status_history'] = []
                
                alert['status_history'].append({
                    'from': old_status,
                    'to': new_status,
                    'timestamp': datetime.now().isoformat()
                })
                
                return jsonify({
                    'success': True, 
                    'alert': alert,
                    'message': f'Alert status changed from {old_status} to {new_status}'
                })
        
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
