# Nhập Môn Thị Giác Máy Tính - Phát Hiện Head & Person

##  Giới Thiệu Đồ Án

Đây là đồ án so sánh **nhiều phương pháp phát hiện đối tượng (object detection)** để nhận diện **head (đầu)** và **person (người)** trong hình ảnh. Dự án bao gồm cả phương pháp truyền thống (HOG + SVM) và phương pháp học sâu hiện đại (YOLO).

###  Mục Tiêu
- So sánh hiệu suất giữa các phương pháp phát hiện đối tượng
- Phát hiện đối tượng loại: **Head** (class 0) và **Person** (class 1)
- Đánh giá độ chính xác, khả năng tổng quát hóa trên tập validation

---

##  Cấu Trúc Thư Mục

```
nhap_mon_thi_giac/
├── README.md                          # File này
├── hog_svm_local.ipynb               # HOG + SVM approach (phương pháp truyền thống)
├── data/                              # Dữ liệu đầu vào
│   ├── train/                         # Tập huấn luyện
│   │   ├── images/                    # Ảnh huấn luyện
│   │   └── labels/                    # Label YOLO format
│   └── valid/                         # Tập validation
│       ├── images/                    # Ảnh validation
│       └── labels/                    # Label YOLO format
├── yolo11n/                           # YOLO11 Nano models & results
│   ├── yolo11n.ipynb                 # Training notebook
│   ├── best.pt                        # Best weights
│   ├── last.pt                        # Last weights
│   ├── args.yaml                      # Training arguments
│   └── results.csv                    # Training results
├── yolo12n/                           # YOLO12 Nano models & results
│   ├── yolo12.ipynb                  # Training notebook
│   ├── best.pt                        # Best weights
│   ├── last.pt                        # Last weights
│   ├── args.yaml                      # Training arguments
│   └── results.csv                    # Training results
└── yolov8s/                           # YOLOv8 Small models & results
    ├── yolov8s.ipynb                 # Training notebook
    ├── best.pt                        # Best weights
    ├── last.pt                        # Last weights
    ├── args.yaml                      # Training arguments
    └── results.csv                    # Training results
```

---

##  Phương Pháp Được Sử Dụng

### 1️⃣ HOG + SVM (Phương Pháp Truyền Thống)
**File:** [hog_svm_local.ipynb](hog_svm_local.ipynb)

#### Đặc điểm:
- **HOG (Histogram of Oriented Gradients)**: Trích xuất đặc trưng hình ảnh
- **SVM (Support Vector Machine)**: Phân loại các đặc trưng
- **Hard Negative Mining (HNM)**: Cải thiện hiệu suất bằng cách tập trung vào các mẫu âm khó

#### Quy trình:
1. **Trích xuất đặc trưng (Feature Extraction)**:
   - Window size Person: 48×96 pixels
   - Window size Head: 16×16 pixels
   - HOG parameters: 9 orientations, 8×8 pixels per cell, 2×2 cells per block

2. **Chuẩn bị dữ liệu**:
   - Trích xuất các mẫu dương từ bounding boxes gốc
   - Tạo mẫu âm ngẫu nhiên (20 mẫu/ảnh), tránh IOU > 0.3 với ground truth
   - Lưu checkpoint mỗi 500 ảnh (an toàn khi rerun)

3. **Huấn luyện**:
   - SGDClassifier (loss="modified_huber")
   - 3 epochs huấn luyện, có class weighting cân bằng

4. **Hard Negative Mining (HNM)**:
   - Chạy detector trên 500 ảnh
   - Thu thập các false positives
   - Huấn luyện lại model với các mẫu âm này

5. **Inference**:
   - Sliding window với bước 8 pixels, đa scale (1.0, 0.9, ..., 0.4)
   - Non-Maximum Suppression (NMS) với threshold = 0.1

#### Hyperparameter quan trọng:
```python
PERSON_WINDOW = (48, 96)              # Kích thước window cho person
HEAD_WINDOW = (16, 16)                # Kích thước window cho head
HOG_ORIENTATIONS = 9                  # Số orientations trong HOG
NEGATIVE_SAMPLES_PER_IMG = 20         # Mẫu âm mỗi ảnh
PERSON_DETECT_THRESH = 1.5            # Confidence threshold
HEAD_DETECT_THRESH = 2
NMS_THRESH = 0.1                      # Non-max suppression
```

---

### 2️⃣ YOLO11 Nano
**File:** [yolo11n/yolo11n.ipynb](yolo11n/yolo11n.ipynb)

YOLO11 là phiên bản mới nhất của ultralytics YOLO series.

**Cấu hình huấn luyện:**
- **Model**: YOLO11 Nano (pretrained on COCO)
- **Epochs**: 50
- **Image size**: 832×832 pixels
- **Batch size**: 4
- **Optimizer**: AdamW
- **Learning rate**: 0.001 (với cosine annealing)
- **Data augmentation**: Mosaic, Mixup, Flip, Scale
- **Early stopping**: Patience = 20 epochs

**Kết quả:** Lưu tại `best.pt` và `last.pt`

---

### 3️⃣ YOLO12 Nano
**File:** [yolo12n/yolo12.ipynb](yolo12n/yolo12.ipynb)

YOLO12 là phiên bản tiếp theo với cấu trúc P2 (pyramid level).

**Cấu hình huấn luyện:**
- **Model**: YOLO12 Nano (pretrained)
- **Epochs**: 50
- **Image size**: 832×832 pixels
- **Batch size**: 4
- **Optimizer**: AdamW
- **Learning rate**: 0.001 (cosine annealing)
- **Data augmentation**: Mosaic, Mixup, Flip, Scale
- **Resume capability**: Có thể tiếp tục huấn luyện từ checkpoint

**Kết quả:** Lưu tại `best.pt` và `last.pt`

---

### 4️⃣ YOLOv8 Small
**File:** [yolov8s/yolov8s.ipynb](yolov8s/yolov8s.ipynb)

YOLOv8 là phiên bản phổ biến, có multiple training sessions cho refinement.

**Cấu hình huấn luyện:**
- **Model**: YOLOv8 Small (pretrained)
- **Epochs**: 50 + 30 (fine-tuning sessions)
- **Image size**: 832×832 pixels
- **Batch size**: 4
- **Optimizer**: AdamW
- **Learning rate**: 0.001
- **Data augmentation**: Mosaic, Mixup, Flip, Scale, Copy-paste
- **Multi-scale training**: Kích hoạt trong fine-tuning

**Đặc điểm:**
- Multiple resumable training sessions cho experimentation
- Fine-tuning với `close_mosaic=10` để cải thiện độ chính xác cuối cùng

**Kết quả:** Lưu tại `best.pt` và `last.pt`

---

##  Format Dữ Liệu

### YOLO Format (cho YOLO models)
```
# Format: class_id center_x center_y width height (normalized 0-1)
0 0.5 0.5 0.3 0.4    # Head tại tâm (0.5, 0.5), kích thước 30%×40%
1 0.3 0.6 0.5 0.7    # Person
```

### Classes
- **0**: Head (đầu)
- **1**: Person (người)

---

##  Cách Sử Dụng

### Yêu cầu (Requirements)
```bash
pip install ultralytics opencv-python scikit-learn scikit-image numpy imutils tqdm
```

### 1. Chạy HOG + SVM
```bash
# Mở Jupyter Notebook
jupyter notebook hog_svm_local.ipynb

# Hoặc chạy trong VS Code Interactive
# Chạy từng cell theo thứ tự
```

**Output:**
- Dữ liệu đặc trưng: `dataset/train_X_*.npy`, `dataset/val_X_*.npy`
- Model SVM: `dataset/svm_person.pkl`, `dataset/svm_head.pkl`
- Evaluation metrics: Accuracy, Precision, Recall, F1-score

### 2. Chạy YOLO Models
```bash
# YOLO11
jupyter notebook yolo11n/yolo11n.ipynb

# YOLO12
jupyter notebook yolo12n/yolo12.ipynb

# YOLOv8
jupyter notebook yolov8s/yolov8s.ipynb
```

**Outputs:**
- Trained weights: `best.pt`, `last.pt`
- Training log: `results.csv`
- Training config: `args.yaml`

### 3. Inference với trained models
```python
from ultralytics import YOLO

# Load model
model = YOLO("yolo11n/best.pt")  # hoặc yolo12n/best.pt, yolov8s/best.pt

# Predict
results = model.predict(source="path/to/image.jpg", conf=0.5)

# Visualize
for r in results:
    print(r.boxes)  # Bounding boxes
    r.show()        # Hiển thị kết quả
```

---

##  Kết Quả Đạo Tạo (Training Results)

Mỗi model lưu kết quả trong `results.csv`:
- **metrics/precision**: Precision score
- **metrics/recall**: Recall score
- **metrics/mAP50**: Mean Average Precision @IoU=0.5
- **metrics/mAP50-95**: Mean Average Precision @IoU=0.5:0.95
- **loss/box_loss**: Loss của bounding boxes
- **loss/cls_loss**: Loss của classification
- **loss/dfl_loss**: Distribution Focal Loss

---

##  Kiến Thức Chính

### Object Detection Concepts
1. **Bounding Box**: Hình chữ nhật xác định vị trí đối tượng
2. **Confidence Score**: Độ tin cậy của dự đoán (0-1)
3. **IoU (Intersection over Union)**: Độ đo độ trùng lặp giữa 2 boxes
4. **NMS (Non-Maximum Suppression)**: Loại bỏ các box trùng lặp

### HOG + SVM
- **HOG**: Trích xuất đặc trưng dựa trên hướng gradient
- **SVM**: Tìm siêu phẳng tối ưu phân tách 2 class
- **Sliding Window**: Quét từng vùng nhỏ trong ảnh
- **Hard Negative Mining**: Cải thiện bằng cách tập trung vào khó mẫu âm

### YOLO
- **End-to-end Detection**: Một lượt dự đoán cả vị trí và class
- **Anchor-free**: Không sử dụng anchor boxes
- **Multi-scale**: Xử lý đối tượng kích thước khác nhau
- **Real-time**: Tối ưu cho tốc độ và độ chính xác

---

##  So Sánh Các Phương Pháp

| Tiêu Chí | HOG + SVM | YOLO11 | YOLO12 | YOLOv8 |
|---------|---------|--------|--------|--------|
| **Loại** | Traditional ML | Deep Learning | Deep Learning | Deep Learning |
| **Tốc độ** | Chậm | Nhanh | Nhanh | Nhanh |
| **Độ chính xác** | Trung bình | Cao | Cao | Cao |
| **Khó huấn luyện** | Dễ | Khó | Khó | Khó |
| **Memory** | Thấp | Cao | Cao | Cao |
| **Khả năng tổng quát** | Thấp | Cao | Cao | Cao |
| **GPU support** | Không | Có | Có | Có |

---

##  Điều Chỉnh & Tối Ưu

### Để cải thiện độ chính xác:
1. **Tăng epochs** (50 → 100)
2. **Giảm learning rate** (0.001 → 0.0005)
3. **Tăng image size** (832 → 1024)
4. **Thêm data augmentation**
5. **Tối ưu hóa checkpoint** (Cosine annealing LR)

### Để tăng tốc độ:
1. **Giảm image size** (832 → 640)
2. **Tăng batch size** (4 → 8, nếu GPU cho phép)
3. **Sử dụng model nhỏ hơn** (Nano thay vì Small)
4. **Bỏ một số augmentation**

---

## 📝 Các File Quan Trọng

| File | Mô Tả |
|------|--------|
| `hog_svm_local.ipynb` | Toàn bộ pipeline HOG + SVM |
| `yolo11n/yolo11n.ipynb` | Training YOLO11 Nano |
| `yolo12n/yolo12.ipynb` | Training YOLO12 Nano |
| `yolov8s/yolov8s.ipynb` | Training YOLOv8 Small |
| `yolo**/best.pt` | Model trọng số tốt nhất |
| `yolo**/last.pt` | Model trọng số cuối cùng |
| `yolo**/results.csv` | Lịch sử huấn luyện |

---

##  Troubleshooting

### CUDA/GPU Issues
```python
import torch
torch.cuda.empty_cache()  # Giải phóng GPU memory
```

### Out of Memory
- Giảm batch size (4 → 2)
- Giảm image size (832 → 640)
- Sử dụng model nhỏ hơn (Small → Nano)

### Model không hội tụ
- Kiểm tra dữ liệu (labels, images)
- Tăng warmup epochs (3.0 → 5.0)
- Giảm learning rate (0.001 → 0.0005)

---

##  Tài Liệu Tham Khảo

- [Ultralytics YOLOv8 Documentation](https://docs.ultralytics.com/)
- [HOG & SVM Paper](https://lear.inrialpes.fr/people/triggs/pubs/Dalal-cvpr05.pdf)
- [YOLO Paper](https://arxiv.org/abs/1506.02640)

---

## Thành viên nhóm 
23521396 - Hứa Mạnh Tân 
23521376 - Nguyễn Tấn Tài 
---

# Kết quả huấn luyện 
| phương pháp | MAP@50 |
|------|--------|
| Yolov8s | 0.772 |
| SVM với HOG | 0.114|
