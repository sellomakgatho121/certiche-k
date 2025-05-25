import type { DetectForgeryOutput } from '@/ai/flows/detect-forgery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Percent, ListChecks } from 'lucide-react';

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
            <Percent size={24} className="text-primary" />
            Confidence Score
          </CardTitle>
          <CardDescription>
            The confidence level regarding the forgery assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Progress value={confidencePercentage} className="w-full h-3" />
            <span className="font-semibold text-primary">{confidencePercentage}%</span>
          </div>
           <p className="text-sm text-muted-foreground mt-1">
            Confidence that the document is {report.isForged ? 'forged' : 'not forged / analysis inconclusive'}.
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
    </div>
  );
}
