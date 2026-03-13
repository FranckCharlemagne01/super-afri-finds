import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCommunesByCity } from "@/data/communes";

interface CommuneSelectProps {
  city: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CommuneSelect = ({ city, value, onValueChange, placeholder = "Sélectionnez votre commune", disabled = false }: CommuneSelectProps) => {
  const availableCommunes = getCommunesByCity(city);

  if (!city || availableCommunes.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={city ? "Aucune commune disponible" : "Choisissez d'abord une ville"} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-12 rounded-xl border-input bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] z-[100] bg-popover border-border">
        {availableCommunes.map((commune) => (
          <SelectItem key={commune.name} value={commune.name}>
            {commune.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
