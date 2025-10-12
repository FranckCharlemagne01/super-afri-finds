import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCitiesByCountry } from "@/data/cities";

interface CitySelectProps {
  countryCode: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const CitySelect = ({ countryCode, value, onValueChange, placeholder = "Sélectionnez votre ville" }: CitySelectProps) => {
  const availableCities = getCitiesByCountry(countryCode);

  if (!countryCode || availableCities.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Choisissez d'abord un pays" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {availableCities.map((city) => (
          <SelectItem key={city.name} value={city.name}>
            {city.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
