import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeToggle } from "@/components/ThemeToggle";
import { onboardingQuestions, generateLearningPath } from "@/data/mockData";
import { toast } from "sonner";

export const Onboarding = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const question = onboardingQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / onboardingQuestions.length) * 100;

  const handleAnswer = (value: string | string[]) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleNext = () => {
    if (!answers[question.id]) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestion < onboardingQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Generate learning path
      const path = generateLearningPath(Object.values(answers));
      localStorage.setItem("learningPath", JSON.stringify(path));
      toast.success("Your personalized path is ready!");
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
            <h1 className="text-2xl font-bold">FinLearn</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl animate-fade-in">
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestion + 1} of {onboardingQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
            <CardTitle className="text-2xl">{question.question}</CardTitle>
            <CardDescription>
              {question.multiple ? "Select all that apply" : "Choose one option"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.multiple ? (
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <Checkbox
                      id={`option-${idx}`}
                      checked={(answers[question.id] as string[] || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const current = (answers[question.id] as string[]) || [];
                        if (checked) {
                          handleAnswer([...current, option]);
                        } else {
                          handleAnswer(current.filter((v) => v !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup value={answers[question.id] as string} onValueChange={handleAnswer}>
                <div className="space-y-3">
                  {question.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            <div className="flex gap-3 pt-4">
              {currentQuestion > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
              )}
              <Button variant="hero" onClick={handleNext} className="flex-1">
                {currentQuestion === onboardingQuestions.length - 1 ? "Complete" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
