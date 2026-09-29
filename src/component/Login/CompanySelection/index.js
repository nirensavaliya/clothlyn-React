import React from "react";
import Button from "../../common/Button";
import InputElement from "../../common/InputElement";
import SelectElement from "../../common/Select";

const CompanySelection = ({
  formData,
  errors,
  onChange,
  onPrevious,
  onNextStep,
  companyOptions = [],
}) => {
  const options =
    companyOptions.length > 0
      ? companyOptions
      : [{ value: formData.company, label: formData.company }];

  const handleSubmit = (e) => {
    e.preventDefault();
    onNextStep(3);
  };

  return (
    <div className="h-full">
      <div className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-4">
          <div className="text-start">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Code
            </label>
            <InputElement
              type="text"
              value={formData.clientCode}
              readOnly
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 ">
          <div className="text-start">
            <SelectElement
              name="Select Company"
              id="company-selection"
              value={formData.company}
              onChange={(value) => onChange("company", value)}
              options={options}
              placeholder="Select Company"
              error={errors.company}
              is_required={false}
              variant="solid"
              className="w-full"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              variant="default"
              size="large"
              label="Back"
              className="w-full !py-3 !px-4 focus:!ring-0 focus:!outline-none"
              onClick={onPrevious}
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              label="Next"
              disabled={!formData.company}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 !py-3 !px-4"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySelection;
