"use client";

import { useState, useEffect } from "react";
import * as tmImage from "@teachablemachine/image";

export default function Home() {
  const [model, setModel] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [result, setResult] = useState("Cargando modelo...");
  const [loading, setLoading] = useState(false);

  const MODEL_URL = "/modelo/";

  // 🔥 Precarga automática
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";

      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
      setResult("Modelo listo ✅");
    } catch (error) {
      console.error(error);
      setResult("Error cargando modelo ❌");
    }
  };

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setPrediction(null);
    setResult("Imagen cargada, analizando...");
    predict(file);
  };

  const predict = async (file: File) => {
    if (!model) return;

    setLoading(true);

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    await new Promise((res) => (img.onload = res));

    const predictions = await model.predict(img);

    const best = predictions.reduce((a: any, b: any) =>
      a.probability > b.probability ? a : b
    );

    setPrediction(best);
    setLoading(false);
    setResult("Selecciona la categoría 👇");
  };

  // 🎯 Validación contra selección del usuario
  const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const validateAnswer = (userChoice: string) => {
  if (!prediction) return;

  const modelPrediction = normalize(prediction.className);
  const user = normalize(userChoice);

  if (user === modelPrediction) {
    setResult(
      `🎉 ¡Correcto! Era ${prediction.className} (${(
        prediction.probability * 100
      ).toFixed(1)}%)`
    );
  } else {
    setResult(
      `❌ Incorrecto. Elegiste "${userChoice}", pero el modelo detectó "${prediction.className}" (${(
        prediction.probability * 100
      ).toFixed(1)}%).\n\n💡 Revisa las características del material (textura, color, uso común).`
    );
  }
};

  const categories = [
  "Carton",
  "Vidrio",
  "Metal",
  "Organico",
  "Papel",
  "Plastico",
  "Basura",
];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-100 dark:bg-black p-6">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
          Clasificador de residuos ♻️
        </h1>

        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="mb-4"
        />

        {image && (
          <img
            src={image}
            className="w-64 mx-auto rounded-xl shadow mb-4"
          />
        )}

        {loading && (
          <p className="text-blue-500 font-medium">Analizando imagen...</p>
        )}

        {/* 🎯 Botones de selección */}
        {prediction && !loading && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => validateAnswer(cat)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl capitalize shadow"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <h2 className="mt-6 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          {result}
        </h2>
      </div>
    </div>
  );
}