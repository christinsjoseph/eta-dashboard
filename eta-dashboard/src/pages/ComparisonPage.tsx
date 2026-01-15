import { useState } from "react";
import ComparisonOverview from "./ComparisonOverview";
import CityComparisonPage from "./CityComparisonPage";

type Props = {
  leftSource: any;
  rightSource: any;
  onBack: () => void; // ← exits comparison completely (back to home)
};

export default function ComparisonPage({
  leftSource,
  rightSource,
  onBack,
}: Props) {
  // null → show overview
  // string → show city comparison
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // 🔁 CITY COMPARISON VIEW
  if (selectedCity) {
    return (
      <CityComparisonPage
        city={selectedCity}
        leftSource={leftSource}
        rightSource={rightSource}
        onBackToOverview={() => setSelectedCity(null)} // ← ONLY go back to overview
        onExitComparison={onBack} // ← exit comparison completely
      />
    );
  }

  // 📊 OVERVIEW COMPARISON VIEW
  return (
    <ComparisonOverview
      leftSource={leftSource}
      rightSource={rightSource}
      onCityClick={(city) => setSelectedCity(city)}
      onExitComparison={onBack} // ← exit comparison completely
    />
  );
}
