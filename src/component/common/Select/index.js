import React from 'react';
import Select from 'react-select';
import classNames from 'classnames';

/** Clothlyn brand — used for focus / hover / selected across all dropdowns */
const BRAND = {
  primary: '#7D766C',
  primaryHover: '#6A645C',
  gold: '#C5B396',
  cream: '#EFE7DC',
  creamSoft: '#F9F6F1',
  white: '#FFFFFF',
  border: '#CFC5B9',
  borderSoft: '#E8DFD4',
  text: '#0B1C30',
  muted: '#7D766C',
  focusRing: 'rgba(125, 118, 108, 0.35)',
};

const SelectElement = ({
  name,
  is_required = false,
  id = '',
  value,
  onChange = () => {},
  placeholder,
  className = '',
  error,
  disabled = false,
  options = [],
  variant = 'solid', 
  isMulti = false,
  isClearable = true,
  menuPortalTarget = null,
  customStyle= {},
  getOptionValue = (option) => option.value, 
  getOptionLabel = (option) => option.label, 
  ...rest
}) => {


  const variants = {
    glass: {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: state.isFocused ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
        color: 'white',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.5)',
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: 'rgba(255, 255, 255, 0.7)',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: 'white',
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }),
      option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'white' : 'black',
        backgroundColor: state.isSelected
          ? BRAND.primary
          : state.isFocused
            ? BRAND.cream
            : 'transparent',
      }),
    },
    solid: {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: BRAND.creamSoft,
        borderColor: state.isFocused ? BRAND.primary : BRAND.border,
        boxShadow: state.isFocused ? `0 0 0 2px ${BRAND.focusRing}` : 'none',
        '&:hover': {
          borderColor: BRAND.gold,
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: BRAND.muted,
      }),
      singleValue: (provided) => ({
        ...provided,
        color: BRAND.text,
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: BRAND.white,
        border: `1px solid ${BRAND.borderSoft}`,
        boxShadow: '0 8px 24px -12px rgba(75, 68, 58, 0.25)',
      }),
      option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'white' : BRAND.text,
        backgroundColor: state.isSelected
          ? BRAND.primary
          : state.isFocused
            ? BRAND.cream
            : 'transparent',
        '&:active': {
          backgroundColor: BRAND.primaryHover,
          color: 'white',
        },
      }),
    },
    outline: {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: 'transparent',
        borderColor: state.isFocused ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)',
        color: 'white',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.7)',
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: 'rgba(255, 255, 255, 0.7)',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: 'white',
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
      }),
      option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'white' : 'white',
        backgroundColor: state.isSelected
          ? BRAND.primary
          : state.isFocused
            ? 'rgba(125, 118, 108, 0.45)'
            : 'transparent',
      }),
    },
    error: { 
      control: (provided) => ({
        ...provided,
        borderColor: '#F87171', 
        boxShadow: '0 0 0 2px rgba(248, 113, 113, 0.4)',
        '&:hover': {
          borderColor: '#F87171',
        },
      }),
    }
  };

  const currentVariantStyles = variants[variant] || variants.solid;

  const customStyles = {
    ...customStyle,
    control: (provided, state) => {
      let styles = {
        ...provided,
        ...currentVariantStyles.control(provided, state),
        minHeight: '49px', 
        borderRadius: '0.375rem', 
        transition: 'all 0.2s ease-in-out',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'default',
      };
      if (error) {
        styles = { ...styles, ...variants.error.control(provided, state) };
      }
      return styles;
    },
    valueContainer: (provided) => ({
      ...provided,
      padding: '0px 8px', 
      ...(customStyle.valueContainer ? customStyle.valueContainer(provided) : {}),

    }),
    placeholder: (provided, state) => ({
      ...provided,
      ...currentVariantStyles.placeholder(provided, state),
    }),
    singleValue: (provided, state) => ({
      ...provided,
      ...currentVariantStyles.singleValue(provided, state),
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: BRAND.cream,
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: BRAND.text,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: BRAND.muted,
      '&:hover': {
        backgroundColor: BRAND.primary,
        color: 'white',
      },
    }),
    menu: (provided, state) => ({
      ...provided,
      ...currentVariantStyles.menu(provided, state),
      marginTop: '4px',
      borderRadius: '0.375rem',
      zIndex: 100001,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 100001,
    }),
    menuList: (provided) => ({
      ...provided,
      paddingTop: '0',
      paddingBottom: '0',
    }),
    option: (provided, state) => ({
      ...provided,
      ...currentVariantStyles.option(provided, state),
      padding: '10px 16px',
      cursor: 'pointer',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: variant === 'solid' ? BRAND.muted : 'rgba(255, 255, 255, 0.7)',
      '&:hover': {
        color: variant === 'solid' ? BRAND.primaryHover : 'white',
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: BRAND.muted,
      '&:hover': {
        color: BRAND.primaryHover,
      },
    }),
  };


  return (
    <div className={classNames('text-left', className)}>
      {name && (
        <label htmlFor={id} className="block mb-1 one-line">
          <span className="text-light-darkGrey text-sm font-semibold">{name}</span>
          {is_required && <span className="required-star ml-1 text-[#f44336]">*</span>}
        </label>
      )}
      <Select
        id={id}
        value={
          isMulti && Array.isArray(value)
            ? value.map(
                (v) =>
                  options.find((option) => option.value === v) || {
                    value: v,
                    label: v,
                  }
              )
            : options.find((option) => option.value === value) || null
        }
        onChange={(selectedOption) => {
          if (isMulti) {
            onChange(selectedOption ? selectedOption.map(opt => opt.value) : []);
          } else {
            onChange(selectedOption ? selectedOption.value : null);
          }
        }}
        options={options}
        placeholder={placeholder}
        isDisabled={disabled}
        isMulti={isMulti}
        isClearable={isClearable}
        styles={customStyles}
        classNamePrefix="react-select"
        menuPlacement="auto"
        menuPortalTarget={menuPortalTarget}
        getOptionValue={getOptionValue}
        getOptionLabel={getOptionLabel}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: BRAND.primary,
            primary25: BRAND.cream,
            primary50: '#E8DFD4',
            primary75: BRAND.gold,
            danger: '#F87171',
            dangerLight: '#FEE2E2',
            neutral0: BRAND.creamSoft,
            neutral20: BRAND.border,
            neutral30: BRAND.gold,
          },
        })}
        {...rest}
      />
      {error && (
        <div className="mt-1">
          <span className="text-xs text-light-error_500">{error}</span>
        </div>
      )}
    </div>
  );
};

export default SelectElement;
