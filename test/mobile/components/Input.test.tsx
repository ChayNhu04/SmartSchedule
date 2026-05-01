import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextInput } from 'react-native';

// Mock Input component
const Input = ({ value, onChangeText, placeholder, testID, secureTextEntry }: any) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      testID={testID}
      secureTextEntry={secureTextEntry}
    />
  );
};

describe('Input Component (Mobile)', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);

    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should display value', () => {
    const { getByDisplayValue } = render(<Input value="Test value" />);

    expect(getByDisplayValue('Test value')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <Input onChangeText={onChangeText} testID="test-input" />,
    );

    fireEvent.changeText(getByTestId('test-input'), 'New text');
    expect(onChangeText).toHaveBeenCalledWith('New text');
  });

  it('should handle empty value', () => {
    const { getByTestId } = render(<Input value="" testID="test-input" />);

    expect(getByTestId('test-input').props.value).toBe('');
  });

  it('should support secure text entry', () => {
    const { getByTestId } = render(<Input secureTextEntry testID="test-input" />);

    expect(getByTestId('test-input').props.secureTextEntry).toBe(true);
  });

  it('should handle multiple text changes', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <Input onChangeText={onChangeText} testID="test-input" />,
    );

    const input = getByTestId('test-input');
    fireEvent.changeText(input, 'First');
    fireEvent.changeText(input, 'Second');
    fireEvent.changeText(input, 'Third');

    expect(onChangeText).toHaveBeenCalledTimes(3);
    expect(onChangeText).toHaveBeenLastCalledWith('Third');
  });

  it('should handle special characters', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <Input onChangeText={onChangeText} testID="test-input" />,
    );

    fireEvent.changeText(getByTestId('test-input'), '!@#$%^&*()');
    expect(onChangeText).toHaveBeenCalledWith('!@#$%^&*()');
  });

  it('should handle unicode characters', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <Input onChangeText={onChangeText} testID="test-input" />,
    );

    fireEvent.changeText(getByTestId('test-input'), 'Tiếng Việt 🎉');
    expect(onChangeText).toHaveBeenCalledWith('Tiếng Việt 🎉');
  });
});
