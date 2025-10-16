import { supabase } from "@/integrations/supabase/client";

export interface OnboardingAnswers {
  q1?: string;
  q2?: string | string[];
  q3?: string | string[];
  q4?: string;
  q5?: string;
}

// Your ML backend API URL
const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:8000";

export async function getModuleRecommendations(answers: OnboardingAnswers): Promise<string[]> {
  try {
    // Call your FastAPI backend
    const response = await fetch(`${ML_API_URL}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answers),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendedModules || [];
  } catch (error) {
    console.error("ML API error, falling back to Lovable AI:", error);

    // Fallback to Supabase edge function (optional)
    try {
      const { data, error: supabaseError } = await supabase.functions.invoke("recommend-modules", {
        body: { answers },
      });

      if (supabaseError) throw supabaseError;
      return data.recommendedModules || [];
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);

      // Final fallback to static default modules
      return [
        "Budgeting", "Saving", "EmergencyFund", "Banking",
        "Investing101", "PortfolioDiversification", "PersonalFinance",
        "Tax", "Insurance", "DebtManagement", "WealthManagement", "RetirementPlanning"
      ];
    }
  }
}
