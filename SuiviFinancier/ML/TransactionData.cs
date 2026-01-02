using Microsoft.ML.Data;

namespace SuiviFinancier.ML
{
    public class TransactionData
    {
        [LoadColumn(0)]
        public string TitreTransaction { get; set; }

        [LoadColumn(1)]
        public string Categorie { get; set; }
    }

    public class CategoryPrediction
    {
        [ColumnName("PredictedLabel")]
        public string PredictedCategory { get; set; }

        public float[] Score { get; set; }
    }
}
