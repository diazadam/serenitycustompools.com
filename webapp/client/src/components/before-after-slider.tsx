import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

// Using your real project photos for before/after examples
import beforeImage1 from "@assets/project02.jpeg";
import afterImage1 from "@assets/project01.jpeg";
import beforeImage2 from "@assets/project04.jpeg";
import afterImage2 from "@assets/project03.jpeg";
import beforeImage3 from "@assets/project05.jpeg";
import afterImage3 from "@assets/generated_images/Luxury_infinity_pool_waterfall_ce522101.png";

const transformations = [
  {
    id: 1,
    title: "Dawsonville Estate Transformation",
    before: beforeImage1,
    after: afterImage1,
    description: "From basic backyard to luxury infinity pool paradise",
    location: "Dawsonville, GA",
    timeframe: "10 weeks",
    investment: "$185,000"
  },
  {
    id: 2,
    title: "Lake Lanier Luxury Upgrade",
    before: beforeImage2,
    after: afterImage2,
    description: "Complete pool renovation with modern features",
    location: "Cumming, GA",
    timeframe: "8 weeks",
    investment: "$165,000"
  },
  {
    id: 3,
    title: "North Georgia Modern Oasis",
    before: beforeImage3,
    after: afterImage3,
    description: "Custom infinity pool with mountain views",
    location: "Gainesville, GA",
    timeframe: "12 weeks",
    investment: "$245,000"
  }
];

export default function BeforeAfterSlider() {
  const [currentProject, setCurrentProject] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const nextProject = () => {
    setCurrentProject((prev) => (prev + 1) % transformations.length);
    setSliderPosition(50);
  };

  const prevProject = () => {
    setCurrentProject((prev) => (prev - 1 + transformations.length) % transformations.length);
    setSliderPosition(50);
  };

  const resetSlider = () => {
    setSliderPosition(50);
  };

  const project = transformations[currentProject];

  return (
    <Card className="max-w-4xl mx-auto shadow-2xl">
      <CardHeader className="text-center bg-gradient-to-r from-luxury-navy to-luxury-charcoal text-white">
        <CardTitle className="text-3xl font-serif flex items-center justify-center gap-3">
          <RotateCcw className="w-8 h-8 text-luxury-gold" />
          Pool Transformations
        </CardTitle>
        <p className="text-luxury-gray">See the dramatic before and after results</p>
      </CardHeader>

      <CardContent className="p-8">
        {/* Project Info */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-serif font-bold text-luxury-navy mb-2">
            {project.title}
          </h3>
          <p className="text-gray-600 mb-4">{project.description}</p>
          
          <div className="flex justify-center space-x-8 text-sm">
            <div className="text-center">
              <div className="font-semibold text-luxury-navy">Location</div>
              <div className="text-gray-600">{project.location}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-luxury-navy">Timeline</div>
              <div className="text-gray-600">{project.timeframe}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-luxury-navy">Investment</div>
              <div className="text-luxury-gold font-bold">{project.investment}</div>
            </div>
          </div>
        </div>

        {/* Before/After Slider */}
        <div className="relative mb-6">
          <div
            className="relative w-full h-[400px] overflow-hidden rounded-lg cursor-col-resize"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* After Image (Background) */}
            <img
              src={project.after}
              alt="After transformation"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Before Image (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={project.before}
                alt="Before transformation"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleMouseDown}
            >
              {/* Slider Handle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-luxury-gold rounded-full shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
              BEFORE
            </div>
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
              AFTER
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Button
              onClick={prevProject}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <Button
              onClick={resetSlider}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            
            <Button
              onClick={nextProject}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Project Thumbnails */}
        <div className="flex justify-center space-x-4">
          {transformations.map((trans, index) => (
            <button
              key={trans.id}
              onClick={() => {
                setCurrentProject(index);
                setSliderPosition(50);
              }}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentProject
                  ? 'border-luxury-gold scale-110'
                  : 'border-gray-300 hover:border-luxury-gold'
              }`}
            >
              <img
                src={trans.after}
                alt={`Project ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8 pt-6 border-t">
          <h4 className="text-xl font-serif font-bold text-luxury-navy mb-3">
            Ready for Your Own Transformation?
          </h4>
          <p className="text-gray-600 mb-4">
            Let us create your dream pool and outdoor living space
          </p>
          <Button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-luxury-gold hover:bg-yellow-600 text-white px-8 py-3"
          >
            Start Your Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}