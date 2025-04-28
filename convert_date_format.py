import pandas as pd
from datetime import datetime

def convert_date_format(input_file, output_file):
    try:
        # Read the CSV file with semicolon separator
        df = pd.read_csv(input_file, sep=';')
        
        # Convert Year_Month column from DD/MM/YYYY to YYYY-MM
        df['Year_Month'] = pd.to_datetime(df['Year_Month'], format='%d/%m/%Y').dt.strftime('%Y-%m')
        
        # Save the converted file
        df.to_csv(output_file, sep=';', index=False)
        print(f"Successfully converted dates in {input_file} and saved to {output_file}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    input_file = "public/demo_data/Demo data with product groups.csv"
    output_file = "public/demo_data/Demo data with product groups_converted.csv"
    convert_date_format(input_file, output_file) 