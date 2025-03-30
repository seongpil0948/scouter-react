"use client";
import React, { useState, useCallback } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@heroui/button";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "검색어를 입력하세요...",
  value = "",
  onChange,
  onSearch,
  className = "",
}) => {
  const [searchValue, setSearchValue] = useState(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      setSearchValue(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setSearchValue("");
    onChange?.("");
    onSearch?.("");
  }, [onChange, onSearch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(searchValue);
    },
    [searchValue, onSearch],
  );

  return (
    <form className={`relative flex-1 ${className}`} onSubmit={handleSubmit}>
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3 text-gray-400" size={18} />
        <input
          className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder={placeholder}
          aria-label='검색어를 입력하세요...'
          type="text"
          value={searchValue}
          onChange={handleChange}
        />
        {searchValue && (
          <Button
            className="absolute right-10 text-gray-400 hover:text-gray-600"
            type="button"
            onPress={handleClear}
          >
            <XIcon size={18} />
          </Button>
        )}
        <Button
          aria-label="검색"
          className="absolute right-1"
          size="sm"
          type="submit"
          color="primary"
        >
          검색
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
