'use client';

import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, XCircle, Info, FileType, Shield, Eye, Download, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentAnalysisReportProps {
  report: AnalyzeDocumentOutput;
}

const getSeverityBadgeVariant = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'low':
      return 'default'; 
    case 'medium':
      return 'secondary'; 
    case 'high':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'low':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'high':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-muted-foreground';
  }
};

export default function DocumentAnalysisReport({ report }: DocumentAnalysisReportProps) {
  const totalAnomalies = report.anomalies?.length || 0;
  const highSeverityCount = report.anomalies?.filter(a => a.severity === 'high').length || 0;
  const mediumSeverityCount = report.anomalies?.filter(a => a.severity === 'medium').length || 0;
  const lowSeverityCount = report.anomalies?.filter(a => a.severity === 'low').length || 0;

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(report.summary);
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Overall Status */}
      <Card className={`shadow-lg border-2 ${report.isAuthentic ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {report.isAuthentic ? (
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle size={48} className="text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          <CardTitle className={`text-2xl ${report.isAuthentic ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {report.isAuthentic ? 'Document Appears Authentic' : 'Potential Issues Detected'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {report.isAuthentic 
              ? 'The document passed our authenticity checks with no significant concerns.'
              : 'Our analysis found potential issues that may indicate tampering or quality problems.'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleCopySummary}>
          <Copy className="h-4 w-4 mr-2" /> Copy Summary
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
              <p className="text-sm font-medium text-muted-foreground">Analysis Status</p>
              <Badge variant={report.isAuthentic ? "default" : "destructive"} className="mt-1">
                {report.isAuthentic ? "Verified" : "Flagged"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={24} className="text-primary" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Anomalies Overview */}
      {totalAnomalies > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={24} className="text-amber-600" />
              Anomalies Overview
            </CardTitle>
            <CardDescription>
              Summary of {totalAnomalies} observation{totalAnomalies !== 1 ? 's' : ''} found during analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{highSeverityCount}</div>
                <div className="text-sm text-red-600 dark:text-red-400">High Severity</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{mediumSeverityCount}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Severity</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{lowSeverityCount}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Low Severity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Anomalies */}
      {report.anomalies && report.anomalies.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={24} className="text-amber-600" />
              Detailed Findings
            </CardTitle>
            <CardDescription>
              Comprehensive breakdown of all observations and anomalies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.anomalies.map((anomaly, index) => (
              <div key={index}>
                <Card className="bg-secondary/30 border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-semibold text-primary">{anomaly.anomalyType}</h4>
                      <Badge variant={getSeverityBadgeVariant(anomaly.severity)} className="ml-2">
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-foreground">{anomaly.description}</p>
                      </div>
                      
                      {anomaly.location && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                          <p className="text-foreground">{anomaly.location}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-muted-foreground">Severity Level:</p>
                        <span className={`text-sm font-semibold ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < report.anomalies.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Anomalies Found */}
      {(!report.anomalies || report.anomalies.length === 0) && (
        <Card className="shadow-lg border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle size={24} />
              No Specific Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 dark:text-green-400">
              The AI analysis did not identify any specific anomalies or suspicious elements in this document. 
              Please refer to the analysis summary for the complete assessment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}