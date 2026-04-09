"use client";

import { useState } from "react";
import { PropertyType, PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface PropertyTypeQuizProps {
  isOpen: boolean;
  onComplete: (propertyType: PropertyType) => void;
  onCancel: () => void;
}

const PROPERTY_TYPE_DESCRIPTIONS: Record<PropertyType, string> = {
  LOT: "Terrenos para construção em loteamentos ou áreas urbanas",
  HOUSE: "Residências unifamiliares com terreno próprio",
  APARTMENT: "Unidades habitacionais em edifícios condominiais",
  COMMERCIAL: "Imóveis para uso comercial ou empresarial",
  RURAL: "Propriedades rurais como sítios, fazendas e chácaras",
};

const PROPERTY_FEATURES: Record<PropertyType, string[]> = {
  LOT: ["Terreno baldio", "Infraestrutura urbana", "Potencial de construção", "Documentação regular"],
  HOUSE: ["Casa independente", "Terreno privado", "Mais privacidade", "Espaço amplo"],
  APARTMENT: ["Condomínio", "Segurança 24h", "Áreas de lazer", "Menor manutenção"],
  COMMERCIAL: ["Local estratégico", "Alto fluxo", "Vitrine", "Estacionamento"],
  RURAL: ["Área ampla", "Natureza", "Produção", "Lazer rural"],
};

export function PropertyTypeQuiz({ isOpen, onComplete, onCancel }: PropertyTypeQuizProps) {
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const handleTypeSelect = (type: PropertyType) => {
    setSelectedType(type);
    setStep(1);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onComplete(selectedType);
      // Reset state
      setSelectedType(null);
      setStep(0);
    }
  };

  const handleBack = () => {
    setStep(0);
    setSelectedType(null);
  };

  const propertyTypes: PropertyType[] = ["LOT", "HOUSE", "APARTMENT", "COMMERCIAL", "RURAL"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 0 ? "Qual tipo de imóvel você quer cadastrar?" : 
                 selectedType ? `Você selecionou: ${PROPERTY_TYPE_LABELS[selectedType]}` : ""}
              </h2>
              <p className="text-gray-600 mt-1">
                {step === 0 ? "Escolha a categoria que melhor descreve seu imóvel" : 
                 "Confirme as características e continue com o cadastro"}
              </p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              ×
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-2 flex-1 rounded-full ${step === 0 ? "bg-blue-600" : "bg-green-600"}`} />
            <div className={`h-2 flex-1 rounded-full ${step === 1 ? "bg-blue-600" : "bg-gray-200"}`} />
          </div>

          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {propertyTypes.map((type) => (
                <Card 
                  key={type}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-500"
                  onClick={() => handleTypeSelect(type)}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="text-4xl mb-2">{PROPERTY_TYPE_ICONS[type]}</div>
                    <CardTitle className="text-lg">{PROPERTY_TYPE_LABELS[type]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-center mb-3">
                      {PROPERTY_TYPE_DESCRIPTIONS[type]}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {PROPERTY_FEATURES[type].slice(0, 2).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 1 && selectedType && (
            <div className="space-y-6">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{PROPERTY_TYPE_ICONS[selectedType]}</span>
                    <div>
                      <CardTitle className="text-xl">{PROPERTY_TYPE_LABELS[selectedType]}</CardTitle>
                      <CardDescription>{PROPERTY_TYPE_DESCRIPTIONS[selectedType]}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-3">Características principais:</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PROPERTY_FEATURES[selectedType].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Informações necessárias para este tipo:</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  {selectedType === "LOT" && (
                    <>
                      <li>• Quadra e número/identificação do lote</li>
                      <li>• Área total em metros quadrados</li>
                      <li>• Valor do lote (opcional)</li>
                      <li>• Informações sobre o empreendimento</li>
                    </>
                  )}
                  {selectedType === "HOUSE" && (
                    <>
                      <li>• Número de quartos e banheiros</li>
                      <li>• Área construída e área total</li>
                      <li>• Vagas de garagem</li>
                      <li>• Número de suítes (se houver)</li>
                    </>
                  )}
                  {selectedType === "APARTMENT" && (
                    <>
                      <li>• Número de quartos e banheiros</li>
                      <li>• Área construída</li>
                      <li>• Vagas na garagem</li>
                      <li>• Andar do apartamento</li>
                    </>
                  )}
                  {selectedType === "COMMERCIAL" && (
                    <>
                      <li>• Área construída e útil</li>
                      <li>• Tipo de negócio adequado</li>
                      <li>• Vagas de estacionamento</li>
                      <li>• Fachada e vitrine</li>
                    </>
                  )}
                  {selectedType === "RURAL" && (
                    <>
                      <li>• Área total em hectares ou metros quadrados</li>
                      <li>• Tipo de produção ou uso</li>
                      <li>• Estruturas existentes</li>
                      <li>• Acesso e localização</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={step === 0 ? onCancel : handleBack}
              className="flex items-center gap-2"
            >
              {step === 0 ? "Cancelar" : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </>
              )}
            </Button>
            
            {step === 1 && (
              <Button 
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Confirmar e Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
