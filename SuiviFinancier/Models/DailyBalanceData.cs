using Microsoft.ML.Data;

namespace SuiviFinancier.Models
{
    // 1. Classe pour l'Historique (Input pour ML.NET)
    // Le nom de la propriété (Balance) sera utilisé dans l'algorithme.
    public class DailyBalance
    {
        public float Balance { get; set; }
    }

    // 2. Classe pour les Résultats de la Prédiction (Output de ML.NET)
    public class BalancePrediction
    {
        // ML.NET remplit ce tableau avec les valeurs futures prédites.
        [ColumnName("ForecastedValues")] 
        public float[] ForecastedValues { get; set; } = Array.Empty<float>();
    }
}
