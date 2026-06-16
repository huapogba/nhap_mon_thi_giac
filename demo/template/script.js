const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const noImage = document.getElementById('noImage');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const resultContainer = document.getElementById('resultContainer');
const noResult = document.getElementById('noResult');

let selectedFile = null;

// Drag and drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#10b981';
    uploadBox.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))';
});

uploadBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#3b82f6';
    uploadBox.style.background = '#f3f4f6';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#3b82f6';
    uploadBox.style.background = '#f3f4f6';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageSelect(files[0]);
    }
});

// File input change
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageSelect(e.target.files[0]);
    }
});

function handleImageSelect(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Vui lòng chọn một file hình ảnh!');
        return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showError('Hình ảnh quá lớn! Tối đa 10MB.');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        noImage.style.display = 'none';
        
        // Auto-detect
        detectObjects();
    };
    reader.readAsDataURL(file);
}

async function detectObjects() {
    if (!selectedFile) {
        showError('Vui lòng chọn một hình ảnh!');
        return;
    }
    
    // Show loading
    loading.style.display = 'flex';
    errorMessage.style.display = 'none';
    
    try {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const response = await fetch('/detect', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            let errorText = 'Lỗi khi xử lý hình ảnh';
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorText;
            } catch {
                errorText = `Server error: ${response.status}`;
            }
            throw new Error(errorText);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showError(error.message);
        noResult.style.display = 'block';
        resultContainer.style.display = 'none';
    } finally {
        loading.style.display = 'none';
    }
}

function displayResults(data) {
    // Update stats
    document.getElementById('headCount').textContent = data.count_head;
    document.getElementById('personCount').textContent = data.count_person;
    document.getElementById('totalCount').textContent = data.detections.length;
    
    // Update detected image
    document.getElementById('detectedImage').src = data.image;
    
    // Display detections list
    const detectionsList = document.getElementById('detectionsList');
    detectionsList.innerHTML = '';
    
    if (data.detections.length === 0) {
        detectionsList.innerHTML = '<p style="color: #9ca3af; text-align: center;">Không tìm thấy object nào</p>';
    } else {
        data.detections.forEach((detection, index) => {
            const item = document.createElement('div');
            item.className = `detection-item ${detection.class}`;
            
            const label = document.createElement('span');
            label.className = 'detection-label';
            label.textContent = `${index + 1}. ${detection.class.toUpperCase()}`;
            
            const confidence = document.createElement('span');
            confidence.className = 'detection-confidence';
            confidence.textContent = `${(detection.confidence * 100).toFixed(1)}%`;
            
            item.appendChild(label);
            item.appendChild(confidence);
            detectionsList.appendChild(item);
        });
    }
    
    // Show result container
    resultContainer.style.display = 'flex';
    noResult.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Upload button click
document.querySelector('.btn-secondary').addEventListener('click', () => {
    imageInput.click();
});
