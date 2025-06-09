const dropArea = document.getElementById('dropArea');
const input = document.getElementById('imageUpload');
const CONFIDENCE = 0.5;
const span = dropArea.querySelector('span');
let btn = null;
let ctx = null;
function displaySelectedImage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    // Remove previous preview if exists
    const oldDiv = document.getElementById('image-preview-div');
    if (oldDiv) oldDiv.remove();

    const div = document.createElement('div');
    div.id = 'image-preview-div';
    div.style.position = 'relative';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.justifyContent = 'center';
    div.style.alignItems = 'center';

    const img = new window.Image();
    img.onload = function () {
      // Set canvas size to image size (max 400px height)
      const maxHeight = 400;
      let drawWidth = img.width;
      let drawHeight = img.height;
      if (img.height > maxHeight) {
        drawHeight = maxHeight;
        drawWidth = (img.width / img.height) * maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      canvas.style.borderRadius = '2px';
      canvas.style.marginTop = '1rem';
      canvas.style.marginLeft = '1rem';
      canvas.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

      const submitBtn = document.createElement('button');
      submitBtn.textContent = 'Segmenter l’image';
      submitBtn.classList.add('submit-btn');
      submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true; // Disable button to prevent multiple clicks
        submitBtn.textContent = 'Segmentation en cours...';

        await segmentImage(canvas.toDataURL());
        submitBtn.textContent = 'Image segmentée';
        submitBtn.disabled = false; // Re-enable button after processing
        submitBtn.style.backgroundColor = '#4CAF50'; // Change color to indicate completion
        submitBtn.style.color = '#fff'; // Change text color for better visibility
        submitBtn.style.cursor = 'not-allowed'; // Change cursor to indicate no further action
        submitBtn.style.pointerEvents = 'none'; // Disable further clicks
        span.textContent = 'Image segmentée avec succès !';
        makeInputSmall();
      });

      div.appendChild(submitBtn);
      window.ctx = ctx; // Store ctx globally for debugging
      div.appendChild(canvas);
      document.body.appendChild(div);
    };
    img.src = e.target.result;
  };

  reader.onerror = function () {
    console.error('Erreur lors de la lecture du fichier');
    alert('Erreur lors de la lecture du fichier. Veuillez réessayer.');
  };

  reader.readAsDataURL(file);
}
function removeSelectedImage(file) {
  const img = document.querySelector('img');
  dropArea.style.height = '400px';
  document.body.style.flexDirection = 'column';
  if (img) {
    img.remove();
  }
  span.textContent =
    'Déposez une image ici ou cliquez pour sélectionner (PNG, JPG, JPEG)';
}
function makeInputSmall() {
  dropArea.style.height = '200px';
  document.body.style.flexDirection = 'row';
}

['dragenter', 'dragover'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('dragover');
    //   span.textContent = 'Relâchez pour télécharger l’image';
  });
});
input.addEventListener('change', (e) => {
  const fileList = e.target.files;
  if (fileList && fileList.length > 0) {
    const file = fileList[0];
    if (file.type.startsWith('image/')) {
      span.textContent = `Fichier prêt : ${file.name}`;
      displaySelectedImage(file);
      makeInputSmall();
    } else {
      span.textContent =
        'Veuillez sélectionner une image valide (PNG, JPG, JPEG)';
      removeSelectedImage(file);
    }
  }
});

['dragleave', 'drop'].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('dragover');
  });
});

dropArea.addEventListener('drop', (e) => {
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    input.files = e.dataTransfer.files;
    // Optionally, trigger a change event
    input.dispatchEvent(new Event('change'));
  }
});
async function segmentImage(imageSrc) {
  try {
    const response = await fetch(
      'https://serverless.roboflow.com/infer/workflows/anass-dabaghi-iac81/custom-workflow-3',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: 'RyJWYPyKpym7ieKcjQaZ',
          inputs: {
            image: {
              type: 'base64',
              value: imageSrc.split(',')[1], // Extract base64 part
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la segmentation de l’image');
    }

    const data = await response.json();
    if (data && data.outputs) {
      const predictions = data.outputs[0].predictions.predictions || [];
      console.log('Predictions:', predictions.length); // Debugging line
      drawPredictions(predictions);
    }
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la segmentation de l’image. Veuillez réessayer.');
  }
}

function drawPredictions(predictions) {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  predictions.forEach((prediction) => {
    const { points, class: className, confidence } = prediction;
    if (confidence < CONFIDENCE) return; // Skip low confidence predictions
    if (points && points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.strokeStyle = getColorForClass(className);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = getColorForClass(className, 0.5);
      ctx.fill();
    }
    // Calculate centroid of the polygon
    let sumX = 0,
      sumY = 0;
    points.forEach((point) => {
      sumX += point.x;
      sumY += point.y;
    });
    const centroidX = sumX / points.length;
    const centroidY = sumY / points.length;

    // Draw class and confidence at centroid
    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw class name
    ctx.fillStyle = getColorForClass(className, 1);
    ctx.strokeText(className, centroidX, centroidY - 14);
    ctx.fillText(className, centroidX, centroidY - 14);

    // Draw confidence if available
    if (confidence) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(
        `${(confidence * 100).toFixed(2)}%`,
        centroidX,
        centroidY + 6
      );
    }
    ctx.restore();
  });

  document.querySelector('button').remove();
  canvas.style.transform = 'scale(2)';
}

function getColorForClass(className, alpha = 1) {
  const classColorMap = {
    apple: '120, 50%, 85%',
    banana: '50, 100%, 60%',
    cherry: '0, 100%, 50%',
    cucumber: '120, 100%, 10%',
    grapes: '270, 100%, 25%',
    kiwi: '120, 80%, 40%',
    lemon: '45, 100%, 60%',
    mango: '35, 100%, 55%',
    orange: '30, 100%, 50%',
    pinapple: '90, 100%, 85%',
    tomato: '15, 100%, 50%',
    water_melon: '120, 100%, 15%',
  };
  return `hsla(${classColorMap[className]}, ${alpha})`; // Random color for each class
}
