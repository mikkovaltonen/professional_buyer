import csv
import json
import os

def convert_string_to_float(value):
    if not value:
        return None
    # Replace comma with dot and convert to float
    return float(value.replace(',', '.'))

def convert_csv_to_json(csv_file_path, json_file_path):
    # Read CSV file
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        # Use semicolon as delimiter
        csv_reader = csv.DictReader(csv_file, delimiter=';')
        
        # Convert to list of dictionaries
        data = list(csv_reader)
        
        # Convert numeric fields to numbers
        for row in data:
            if 'Quantity' in row:
                row['Quantity'] = convert_string_to_float(row['Quantity'])
            if 'forecast_12m' in row:
                row['forecast_12m'] = convert_string_to_float(row['forecast_12m'])
            if 'old_forecast' in row:
                row['old_forecast'] = convert_string_to_float(row['old_forecast'])
            if 'old_forecast_error' in row:
                row['old_forecast_error'] = convert_string_to_float(row['old_forecast_error'])
            if 'correction_percent' in row:
                row['correction_percent'] = convert_string_to_float(row['correction_percent'])

    # Write JSON file
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    # Define paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    csv_path = os.path.join(project_root, 'public', 'demo_data', 'Demo data with product groups.csv')
    json_path = os.path.join(project_root, 'public', 'demo_data', 'forecast_data.json')
    
    # Convert CSV to JSON
    convert_csv_to_json(csv_path, json_path)
    print(f'CSV converted to JSON and saved to {json_path}') 