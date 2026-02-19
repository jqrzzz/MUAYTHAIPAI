"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, Shield, Info } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface LegalComplianceProps {
  onComplianceChange: (isCompliant: boolean) => void
  className?: string
}

export function LegalCompliance({ onComplianceChange, className = "" }: LegalComplianceProps) {
  const [agreements, setAgreements] = useState({
    masterAgreement: false,
  })
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked }
    setAgreements(newAgreements)
    onComplianceChange(newAgreements.masterAgreement)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="border rounded-lg p-3 md:p-4 bg-orange-50 border-orange-200">
        <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm md:text-base">
          <Shield className="h-4 w-4" />
          Legal Agreement
        </h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="masterAgreement"
              checked={agreements.masterAgreement}
              onCheckedChange={(checked) => handleAgreementChange("masterAgreement", checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="masterAgreement" className="text-xs md:text-sm leading-relaxed">
              I agree to the{" "}
              <a
                href="/terms-conditions"
                target="_blank"
                className="text-orange-600 hover:text-orange-700 underline font-medium"
                rel="noreferrer"
              >
                Terms & Conditions
              </a>
              ,{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                className="text-orange-600 hover:text-orange-700 underline font-medium"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
              ,{" "}
              <a
                href="/terms-conditions#liability-waiver"
                target="_blank"
                className="text-orange-600 hover:text-orange-700 underline font-medium"
                rel="noreferrer"
              >
                Liability Waiver
              </a>
              , and{" "}
              <a
                href="/terms-conditions#refund-policy"
                target="_blank"
                className="text-orange-600 hover:text-orange-700 underline font-medium"
                rel="noreferrer"
              >
                Refund Policy
              </a>
            </Label>
          </div>

          <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-orange-700 hover:text-orange-800 transition-colors">
              <Info className="h-3 w-3" />
              <span className="underline">Important information</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-orange-100 border border-orange-300 rounded p-2 text-xs text-orange-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <p>
                    By checking this box, you confirm you are 18+ or have parental consent, understand all payments are
                    final and non-refundable, and are creating a legally binding agreement.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
