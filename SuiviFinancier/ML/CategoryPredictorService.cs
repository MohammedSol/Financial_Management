using Microsoft.ML;
using Microsoft.ML.Data;
using System;
using System.IO;

namespace SuiviFinancier.ML
{
    public class CategoryPredictorService
    {
        private readonly MLContext _mlContext;
        private ITransformer _model;
        private readonly string _modelPath;

        public CategoryPredictorService(string modelPath = "MLData/category-model.zip")
        {
            _mlContext = new MLContext(seed: 0);
            _modelPath = modelPath;
        }

        public void TrainModel(string dataPath)
        {
            // Load data
            IDataView dataView = _mlContext.Data.LoadFromTextFile<TransactionData>(
                dataPath,
                hasHeader: true,
                separatorChar: ';'
            );

            // Define data preparation and training pipeline
            var pipeline = _mlContext.Transforms.Conversion
                .MapValueToKey(inputColumnName: "Categorie", outputColumnName: "Label")
                .Append(_mlContext.Transforms.Text.FeaturizeText(
                    inputColumnName: "TitreTransaction",
                    outputColumnName: "Features"))
                .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy(
                    labelColumnName: "Label",
                    featureColumnName: "Features"))
                .Append(_mlContext.Transforms.Conversion.MapKeyToValue("PredictedLabel"));

            // Train the model
            _model = pipeline.Fit(dataView);

            // Save the model
            Directory.CreateDirectory(Path.GetDirectoryName(_modelPath));
            _mlContext.Model.Save(_model, dataView.Schema, _modelPath);
        }

        public void LoadModel()
        {
            if (!File.Exists(_modelPath))
            {
                throw new FileNotFoundException($"Le modèle ML n'existe pas à : {_modelPath}");
            }

            _model = _mlContext.Model.Load(_modelPath, out var modelInputSchema);
        }

        public string PredictCategory(string title)
        {
            if (_model == null)
            {
                LoadModel();
            }

            var predictionEngine = _mlContext.Model
                .CreatePredictionEngine<TransactionData, CategoryPrediction>(_model);

            var input = new TransactionData { TitreTransaction = title };
            var prediction = predictionEngine.Predict(input);

            return prediction.PredictedCategory;
        }
    }
}
