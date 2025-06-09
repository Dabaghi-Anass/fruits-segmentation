const imageUrl =
  'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60';
const image = new Image();
image.crossOrigin = 'Anonymous';
const aspectRatio = 1;
image.src = imageUrl;
function resize(image) {
  const width = image.width;
  const height = image.height;
  const newWidth = 800;
  const newHeight = Math.floor(newWidth / aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height, 0, 0, newWidth, newHeight);
  return canvas;
}
image.onload = function () {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  document.body.appendChild(canvas);
};
// const canvas = document.querySelector("canvas");
// const ctx = canvas.getContext("2d");
// fetch(
// 	"https://serverless.roboflow.com/infer/workflows/anass-dabaghi-iac81/custom-workflow-3",
// 	{
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 		},
// 		body: JSON.stringify({
// 			api_key: "RyJWYPyKpym7ieKcjQaZ",
// 			inputs: {
// 				image: {
// 					type: "base64",
// 					value: image,
// 				},
// 			},
// 		}),
// 	}
// ).then((response) => {
// 	response.json().then((result) => {
// 		let imageObj = result.outputs[0].predictions;
// 		var im = new Image();
// 		im.src = image;
// 		document.body.appendChild(im);
// 		im.onload = function () {
// 			ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
// 			imageObj.forEach((pred) => {
// 				ctx.beginPath();
// 				ctx.lineWidth = 3;
// 				ctx.strokeStyle = "red";
// 				ctx.rect(
// 					pred.x - pred.width / 2,
// 					pred.y - pred.height / 2,
// 					pred.width,
// 					pred.height
// 				);
// 				ctx.stroke();
// 				ctx.font = "20px Arial";
// 				ctx.fillStyle = "red";
// 				ctx.fillText(
// 					pred.class,
// 					pred.x - pred.width / 2,
// 					pred.y - pred.height / 2 - 5
// 				);
// 			});
// 		};
// 	});
// });
