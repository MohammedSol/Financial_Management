using Microsoft.AspNetCore.Mvc;
using SuiviFinancier.ML;
using System;
using System.IO;

namespace SuiviFinancier.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MLController : ControllerBase
    {
        private readonly CategoryPredictorService _predictorService;

        public MLController(CategoryPredictorService predictorService)
        {
            _predictorService = predictorService;
        }

        // GET: api/ML/Train
        [HttpGet("train")]
        public IActionResult Train()
        {
            try
            {
                string dataPath = Path.Combine(Directory.GetCurrentDirectory(), "MLData", "training-data.csv");
                
                if (!System.IO.File.Exists(dataPath))
                {
                    return BadRequest($"Fichier de données introuvable: {dataPath}");
                }

                _predictorService.TrainModel(dataPath);
                
                return Ok("✅ Modèle ML entraîné avec succès! Le fichier 'category-model.zip' a été créé dans MLData/");
            }
            catch (Exception ex)
            {
                return BadRequest($"❌ Erreur lors de l'entraînement: {ex.Message}\n\n{ex.StackTrace}");
            }
        }

        // GET: api/ML/Test?text=Courses Carrefour
        [HttpGet("test")]
        public IActionResult Test([FromQuery] string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return BadRequest("Usage: /api/ML/Test?text=Courses Carrefour");
            }

            try
            {
                string prediction = _predictorService.PredictCategory(text);
                return Ok($"📊 Texte: '{text}'\n✅ Catégorie prédite: {prediction}");
            }
            catch (Exception ex)
            {
                return BadRequest($"❌ Erreur: {ex.Message}\n\nAvez-vous entraîné le modèle? Allez sur /api/ML/Train d'abord.");
            }
        }
    }
}
