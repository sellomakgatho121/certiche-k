'use client';

import type { DetectForgeryOutput } from '@/ai/flows/detect-forgery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, XCircle, Percent, ListChecks, FileType, Shield, TrendingUp, Download, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForgeryDetectionReportProps {
  report: DetectForgeryOutput;
}

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.8) return { level: 'Very High', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/20' };
  if (confidence >= 0.6) return { level: 'High', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/20' };
  if (confidence >= 0.4) return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20' };
  if (confidence >= 0.2) return { level: 'Low', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/20' };
  return { level: 'Very Low', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/20' };
};

export default function ForgeryDetectionReport({ report }: ForgeryDetectionReportProps) {
  const confidencePercentage = Math.round(report.confidence * 100);
  const confidenceInfo = getConfidenceLevel(report.confidence);

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forgery-detection.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHeadline = async () => {
    const text = report.isForged ? 'Potential forgery detected' : 'No clear forgery detected';
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const handlePrint = () => { window.print(); };

  return (
    <div className="space-y-6">
      {/* Header Card with Overall Status */}
      <Card className={`shadow-lg border-2 ${report.isForged ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {report.isForged ? (
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle size={48} className="text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <Shield size={48} className="text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>
          <CardTitle className={`text-2xl ${report.isForged ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
            {report.isForged ? 'Potential Forgery Detected' : 'No Clear Forgery Detected'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {report.isForged 
              ? 'Our analysis found evidence suggesting this document may have been tampered with or forged.'
              : 'The document passed our forgery detection checks without raising significant red flags.'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleCopyHeadline}>
          <Copy className="h-4 w-4 mr-2" /> Copy Headline
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadJson}>
          <Download className="h-4 w-4 mr-2" /> Download JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      {/* Document Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileType size={24} className="text-primary" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Document Type</p>
              <p className="text-base font-semibold">{report.identifiedOrConfirmedDocumentType || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Forgery Status</p>
              <Badge variant={report.isForged ? "destructive" : "default"} className="mt-1">
                {report.isForged ? "Suspected Forgery" : "Appears Genuine"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Confidence Score */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={24} className="text-primary" />
            Forgery Confidence Analysis
          </CardTitle>
          <CardDescription>
            AI confidence level that the document contains forged content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${confidenceInfo.bgColor}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Confidence Level</span>
              <span className={`font-bold text-lg ${confidenceInfo.color}`}>
                {confidenceInfo.level}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={confidencePercentage} className="flex-1 h-3" />
              <span className="font-semibold text-primary text-lg min-w-[3rem]">
                {confidencePercentage}%
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Interpretation:</strong> This score indicates the likelihood of forgery based on detected anomalies and content manipulation evidence.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>0-20%:</strong> Very low probability of forgery</li>
              <li><strong>21-40%:</strong> Low probability of forgery</li>
              <li><strong>41-60%:</strong> Moderate concerns detected</li>
              <li><strong>61-80%:</strong> High probability of forgery</li>
              <li><strong>81-100%:</strong> Very high probability of forgery</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies and Inconsistencies */}
      {report.anomalies && report.anomalies.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks size={24} className="text-amber-600" />
              Detected Anomalies & Inconsistencies
            </CardTitle>
            <CardDescription>
              Specific issues and irregularities found during analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.anomalies.map((anomaly, index) => (
                <div key={index}>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-foreground flex-1">{anomaly}</p>
                  </div>
                  {index < report.anomalies.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues Found */}
      {(!report.anomalies || report.anomalies.length === 0) && !report.isForged && (
        <Card className="shadow-lg border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle size={24} />
              No Forgery Indicators Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 dark:text-green-400">
              Our comprehensive analysis did not detect any clear signs of forgery or content manipulation in this document. 
              The document appears to maintain its original integrity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}