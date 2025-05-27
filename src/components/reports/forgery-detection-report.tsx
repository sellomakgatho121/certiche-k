
import type { DetectForgeryOutput } from '@/ai/flows/detect-forgery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Percent, ListChecks, FileType } from 'lucide-react';

interface ForgeryDetectionReportProps {
  report: DetectForgeryOutput;
}

export default function ForgeryDetectionReport({ report }: ForgeryDetectionReportProps) {
  const confidencePercentage = Math.round(report.confidence * 100);

  return (
    <div className="space-y-6 mt-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {report.isForged ? (
              <XCircle size={24} className="text-destructive" />
            ) : (
              <CheckCircle size={24} className="text-green-600" />
            )}
            Forgery Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold ${report.isForged ? 'text-destructive' : 'text-green-600'}`}>
            {report.isForged ? 'Likely Forged Document' : 'No Clear Forgery Detected'}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileType size={24} className="text-primary" />
            Document Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            <strong className="text-foreground/80">Identified/Confirmed Type:</strong> {report.identifiedOrConfirmedDocumentType || "Not specified"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent size={24} className="text-primary" />
            Confidence Score (for Forgery)
          </CardTitle>
          <CardDescription>
            The AI's confidence that the document is forged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Progress value={confidencePercentage} className="w-full h-3" />
            <span className="font-semibold text-primary">{confidencePercentage}%</span>
          </div>
           <p className="text-sm text-muted-foreground mt-1">
            This score indicates the likelihood of forgery based on detected anomalies. A low score, especially with good quality images, suggests less evidence of tampering. Scan artifacts or poor image quality alone (without content manipulation) should result in a low confidence for forgery.
          </p>
        </CardContent>
      </Card>

      {report.anomalies && report.anomalies.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks size={24} className="text-amber-600" />
              Identified Inconsistencies / Anomalies
            </CardTitle>
            <CardDescription>
              The following points were noted during the forgery analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-foreground">
              {report.anomalies.map((anomaly, index) => (
                <li key={index}>{anomaly}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.forgeryTechniquesSuspected && report.forgeryTechniquesSuspected.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={24} className="text-orange-500" />
              Suspected Forgery Techniques
            </CardTitle>
            <CardDescription>
              Potential methods of manipulation suspected by the AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-foreground">
              {report.forgeryTechniquesSuspected.map((technique, index) => (
                <li key={index}>{technique}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
