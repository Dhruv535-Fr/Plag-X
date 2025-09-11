import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  FileCode,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sampleCode1 = `#include <iostream>
#include <vector>
#include <algorithm>

class QuickSort {
private:
    std::vector<int> data;
    
public:
    QuickSort(std::vector<int> input) : data(input) {}
    
    void sort() {
        quickSort(0, data.size() - 1);
    }
    
    void quickSort(int low, int high) {
        if (low < high) {
            int pivot = partition(low, high);
            quickSort(low, pivot - 1);
            quickSort(pivot + 1, high);
        }
    }
    
    int partition(int low, int high) {
        int pivot = data[high];
        int i = low - 1;
        
        for (int j = low; j < high; j++) {
            if (data[j] <= pivot) {
                i++;
                std::swap(data[i], data[j]);
            }
        }
        std::swap(data[i + 1], data[high]);
        return i + 1;
    }
    
    void print() {
        for (int x : data) {
            std::cout << x << " ";
        }
        std::cout << std::endl;
    }
};`;

const sampleCode2 = `#include <iostream>
#include <vector>
#include <algorithm>

class SortingAlgorithm {
private:
    std::vector<int> numbers;
    
public:
    SortingAlgorithm(std::vector<int> arr) : numbers(arr) {}
    
    void performSort() {
        quickSortHelper(0, numbers.size() - 1);
    }
    
    void quickSortHelper(int start, int end) {
        if (start < end) {
            int pivotIndex = partitionArray(start, end);
            quickSortHelper(start, pivotIndex - 1);  
            quickSortHelper(pivotIndex + 1, end);
        }
    }
    
    int partitionArray(int start, int end) {
        int pivotValue = numbers[end];
        int smallerIndex = start - 1;
        
        for (int current = start; current < end; current++) {
            if (numbers[current] <= pivotValue) {
                smallerIndex++;
                std::swap(numbers[smallerIndex], numbers[current]);
            }
        }
        std::swap(numbers[smallerIndex + 1], numbers[end]);
        return smallerIndex + 1;
    }
    
    void displayArray() {
        for (int element : numbers) {
            std::cout << element << " ";
        }
        std::cout << std::endl;
    }
};`;

const matchedSegments = [
  { lines: "1-3", similarity: 100, description: "Identical include statements" },
  { lines: "5-7", similarity: 95, description: "Similar class structure with different names" },
  { lines: "9-11", similarity: 98, description: "Nearly identical constructor patterns" },
  { lines: "13-19", similarity: 92, description: "Similar quicksort implementation logic" },
  { lines: "21-32", similarity: 89, description: "Partition algorithm with variable name changes" },
];

export default function ReportDetail() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Report Analysis</h1>
            <p className="text-muted-foreground">algorithm.cpp vs sorting.cpp</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-danger shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Combined Score</p>
                <p className="text-2xl font-bold text-white">89%</p>
                <p className="text-white/80 text-xs">High Similarity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Jaccard Score</p>
                <p className="text-2xl font-bold text-foreground">85%</p>
                <p className="text-muted-foreground text-xs">Token-based</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GitCompare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">AST Score</p>
                <p className="text-2xl font-bold text-foreground">92%</p>
                <p className="text-muted-foreground text-xs">Structure-based</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-similarity-low" />
              <div>
                <p className="text-muted-foreground text-sm">Language</p>
                <p className="text-2xl font-bold text-foreground">C++</p>
                <p className="text-muted-foreground text-xs">Both files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCode className="h-5 w-5 text-primary" />
              <span>algorithm.cpp</span>
              <Badge variant="secondary">Original</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="text-sm font-mono bg-code-bg p-4 rounded-lg overflow-x-auto border border-border">
                <code className="text-foreground">
                  {sampleCode1.split('\n').map((line, index) => {
                    const lineNum = index + 1;
                    const isHighlighted = [5, 6, 7, 13, 14, 15, 21, 22, 23].includes(lineNum);
                    return (
                      <div 
                        key={index} 
                        className={cn(
                          "flex",
                          isHighlighted && "code-highlight"
                        )}
                      >
                        <span className="text-muted-foreground w-8 flex-shrink-0 text-right mr-4">
                          {lineNum}
                        </span>
                        <span className="flex-1">{line}</span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCode className="h-5 w-5 text-primary" />
              <span>sorting.cpp</span>
              <Badge className="status-high">Suspected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="text-sm font-mono bg-code-bg p-4 rounded-lg overflow-x-auto border border-border">
                <code className="text-foreground">
                  {sampleCode2.split('\n').map((line, index) => {
                    const lineNum = index + 1;
                    const isHighlighted = [5, 6, 7, 13, 14, 15, 21, 22, 23].includes(lineNum);
                    return (
                      <div 
                        key={index} 
                        className={cn(
                          "flex",
                          isHighlighted && "code-highlight"
                        )}
                      >
                        <span className="text-muted-foreground w-8 flex-shrink-0 text-right mr-4">
                          {lineNum}
                        </span>
                        <span className="flex-1">{line}</span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Matched Segments */}
        <Card className="lg:col-span-2 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Matched Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchedSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      Lines {segment.lines}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {segment.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={cn(
                        segment.similarity >= 95 ? "status-high" : 
                        segment.similarity >= 85 ? "status-medium" : "status-low"
                      )}
                    >
                      {segment.similarity}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Metadata */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Analysis Date</p>
              <p className="text-foreground">January 15, 2024</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processing Time</p>
              <p className="text-foreground">8.7 seconds</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">File Sizes</p>
              <p className="text-foreground">1.2 KB • 1.3 KB</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lines of Code</p>
              <p className="text-foreground">45 • 47</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verdict</p>
              <Badge className="status-high">
                High Similarity Detected
              </Badge>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Confidence Level</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Structural</span>
                  <span>96%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "96%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}