import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface DocumentAnalysisReportProps {
  report: AnalyzeDocumentOutput;
}

const getSeverityBadgeVariant = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'low':
      return 'default'; // Using default for low, can be customized
    case 'medium':
      return 'secondary'; // Using secondary for medium
    case 'high':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function DocumentAnalysisReport({ report }: DocumentAnalysisReportProps) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={24} className="text-primary" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{report.summary}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {report.isAuthentic ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <XCircle size={24} className="text-destructive" />
            )}
            Authenticity Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold ${report.isAuthentic ? 'text-green-600' : 'text-destructive'}`}>
            {report.isAuthentic ? 'Likely Authentic' : 'Potential Issues Found'}
          </p>
        </CardContent>
      </Card>

      {report.anomalies && report.anomalies.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={24} className="text-amber-600" />
              Detected Anomalies
            </CardTitle>
            <CardDescription>
              The following anomalies were identified during the analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.anomalies.map((anomaly, index) => (
              <Card key={index} className="bg-secondary/30 p-4 rounded-md">
                <CardHeader className="p-0 mb-2">
                  <CardTitle className="text-md text-primary">{anomaly.anomalyType}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-1">
                  <p><strong className="text-foreground/80">Description:</strong> {anomaly.description}</p>
                  {anomaly.location && <p><strong className="text-foreground/80">Location:</strong> {anomaly.location}</p>}
                  <div className="flex items-center">
                    <strong className="text-foreground/80 mr-2">Severity:</strong>
                    <Badge variant={getSeverityBadgeVariant(anomaly.severity)} className="capitalize">
                      {anomaly.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
