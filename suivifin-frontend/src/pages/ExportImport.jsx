import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  Chip
} from '@mui/material';
import {
  Download,
  Upload,
  PictureAsPdf,
  TableChart,
  Description,
  CloudDownload,
  Assessment
} from '@mui/icons-material';
import api from '../services/api';

export default function ExportImport() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  // Export Transactions CSV
  const handleExportCsv = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.get('/export/transactions/csv', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: '✅ Export CSV réussi !' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur : ${error.response?.data?.message || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Export Transactions Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.get('/export/transactions/excel', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: '✅ Export Excel réussi !' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur : ${error.response?.data?.message || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Export Budgets PDF
  const handleExportBudgetsPdf = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await api.get('/export/budgets/pdf', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budgets_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: '✅ Export PDF des budgets réussi !' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur : ${error.response?.data?.message || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Générer Rapport Mensuel
  const handleGenerateMonthlyReport = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const [year, month] = reportMonth.split('-');
      const response = await api.get(`/export/report/monthly?year=${year}&month=${month}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${year}_${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: '✅ Rapport mensuel généré avec succès !' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur : ${error.response?.data?.message || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Télécharger Template CSV
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/import/template/csv', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'info', text: '📥 Template CSV téléchargé !' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur : ${error.message}` });
    }
  };

  // Import CSV
  const handleImportCsv = async () => {
    if (!importFile) {
      setMessage({ type: 'warning', text: '⚠️ Veuillez sélectionner un fichier' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/import/transactions/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);
      setMessage({ 
        type: response.data.errorCount > 0 ? 'warning' : 'success', 
        text: response.data.message 
      });
      setImportFile(null);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur : ${error.response?.data?.message || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudDownload /> Export / Import de Données
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* SECTION EXPORT */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Download /> Export de Données
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Export Transactions CSV */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Description color="primary" sx={{ fontSize: 40 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Export CSV</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exporter toutes vos transactions au format CSV
                    </Typography>
                  </Box>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleExportCsv}
                  disabled={loading}
                >
                  Télécharger CSV
                </Button>
              </CardContent>
            </Card>

            {/* Export Transactions Excel */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TableChart color="success" sx={{ fontSize: 40 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Export Excel</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exporter avec mise en forme et graphiques
                    </Typography>
                  </Box>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<Download />}
                  onClick={handleExportExcel}
                  disabled={loading}
                >
                  Télécharger Excel
                </Button>
              </CardContent>
            </Card>

            {/* Export Budgets PDF */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PictureAsPdf color="error" sx={{ fontSize: 40 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Export Budgets PDF</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rapport complet de vos budgets
                    </Typography>
                  </Box>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<PictureAsPdf />}
                  onClick={handleExportBudgetsPdf}
                  disabled={loading}
                >
                  Télécharger PDF
                </Button>
              </CardContent>
            </Card>

            {/* Rapport Mensuel */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Assessment color="secondary" sx={{ fontSize: 40 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Rapport Mensuel</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Générer un rapport détaillé pour un mois
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  type="month"
                  label="Mois"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  startIcon={<Assessment />}
                  onClick={handleGenerateMonthlyReport}
                  disabled={loading}
                >
                  Générer Rapport
                </Button>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* SECTION IMPORT */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Upload /> Import de Données
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Template CSV */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Template CSV
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Téléchargez le modèle CSV pour voir le format attendu
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadTemplate}
                >
                  Télécharger Template
                </Button>
              </CardContent>
            </Card>

            {/* Import CSV */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📤 Importer des Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Format attendu : Date, Type, Montant, Description, Catégorie, Compte
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <input
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="csv-file-input"
                    type="file"
                    onChange={(e) => setImportFile(e.target.files[0])}
                  />
                  <label htmlFor="csv-file-input">
                    <Button
                      fullWidth
                      variant="outlined"
                      component="span"
                      startIcon={<Upload />}
                    >
                      {importFile ? importFile.name : 'Sélectionner un fichier CSV'}
                    </Button>
                  </label>
                </Box>

                {importFile && (
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={`${importFile.name} (${(importFile.size / 1024).toFixed(2)} KB)`}
                      onDelete={() => setImportFile(null)}
                      color="primary"
                    />
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
                  onClick={handleImportCsv}
                  disabled={loading || !importFile}
                >
                  {loading ? 'Import en cours...' : 'Importer Transactions'}
                </Button>

                {/* Résultat de l'import */}
                {importResult && (
                  <Box sx={{ mt: 3 }}>
                    <Alert severity={importResult.errorCount > 0 ? 'warning' : 'success'}>
                      <Typography variant="body2">
                        ✅ <strong>{importResult.successCount}</strong> transactions importées
                      </Typography>
                      {importResult.errorCount > 0 && (
                        <Typography variant="body2" color="error">
                          ❌ <strong>{importResult.errorCount}</strong> erreurs
                        </Typography>
                      )}
                    </Alert>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="error">
                          Erreurs détectées :
                        </Typography>
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <Typography key={index} variant="body2" color="error">
                            • {error}
                          </Typography>
                        ))}
                        {importResult.errors.length > 5 && (
                          <Typography variant="body2" color="error">
                            ... et {importResult.errors.length - 5} autres erreurs
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
