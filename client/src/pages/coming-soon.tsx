import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonProps {
  featureName?: string;
  returnPath?: string;
}

export default function ComingSoon({ 
  featureName = "This feature", 
  returnPath = "/enrollment/company" 
}: ComingSoonProps) {
  const [location, navigate] = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center justify-center mb-6">
              <Construction className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-center text-xl">Coming Soon!</CardTitle>
            <CardDescription className="text-center">
              {featureName} is currently under development and will be available in a future version.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                We're working hard to bring you this feature. In the meantime, you can continue with other parts of your application.
              </p>
              
              <div className="flex justify-center pt-4">
                <Button onClick={() => navigate(returnPath)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Enrollment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}