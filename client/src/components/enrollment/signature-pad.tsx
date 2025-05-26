import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Check, Pen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SignaturePadProps {
  onChange: (signatureData: string) => void;
  value?: string;
  label?: string;
  description?: string;
}

export function SignaturePad({
  onChange,
  value,
  label = "Your Signature",
  description = "Please sign using your mouse or finger to complete this application.",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isPenMode, setIsPenMode] = useState(true);
  const isMobile = useIsMobile();
  
  // Canvas initialization and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas dimensions based on parent element
      resizeCanvas();
      
      // Initialize with existing signature if provided
      if (value) {
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          ctx?.drawImage(img, 0, 0);
          setHasSignature(true);
        };
        img.src = value;
      }
      
      // Listen for window resize to adjust canvas
      window.addEventListener("resize", resizeCanvas);
      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [value]);
  
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      const ratio = window.devicePixelRatio || 1;
      const width = (parent?.clientWidth || 400) - 2; // 2px for border
      canvas.width = width * ratio;
      canvas.height = (width / 3) * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${width / 3}px`;
      
      // Scale context for HiDPI displays
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = isPenMode ? 2 : 5;
        ctx.strokeStyle = "#000000";
      }
    }
  };
  
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      const { offsetX, offsetY } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    }
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      const { offsetX, offsetY } = getCoordinates(e);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    setHasSignature(true);
    
    // Capture the signature as an image and call onChange
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onChange(dataUrl);
    }
  };
  
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      let offsetX = 0;
      let offsetY = 0;
      
      // Handle touch events
      if ("touches" in e) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
      } 
      // Handle mouse events
      else {
        offsetX = (e as React.MouseEvent).nativeEvent.offsetX;
        offsetY = (e as React.MouseEvent).nativeEvent.offsetY;
      }
      
      return { offsetX, offsetY };
    }
    
    return { offsetX: 0, offsetY: 0 };
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onChange("");
    }
  };
  
  const togglePenMode = () => {
    setIsPenMode(!isPenMode);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.lineWidth = !isPenMode ? 2 : 5;
    }
  };
  
  return (
    <Card className="mb-6 border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Instructions specific to device */}
        <p className="text-sm text-muted-foreground">
          {isMobile
            ? "Use your finger to sign in the box below."
            : "Use your mouse to sign in the box below."}
        </p>
        
        {/* Signature Canvas */}
        <div className="relative w-full">
          <canvas
            ref={canvasRef}
            className="border border-input bg-white touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Canvas overlay for visual feedback */}
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground opacity-70">Sign here</p>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={clearSignature}
            disabled={!hasSignature}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePenMode}
          >
            <Pen className="h-4 w-4 mr-2" />
            {isPenMode ? "Thin Pen" : "Thick Pen"}
          </Button>
          
          {hasSignature && (
            <div className="ml-auto flex items-center text-sm text-green-600">
              <Check className="h-4 w-4 mr-1" />
              Signature captured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}