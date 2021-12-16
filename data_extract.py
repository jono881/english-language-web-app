import numpy as np
import pandas as pd
import pandasql as ps
import csv

# reading CSV files
total_data_2016 = pd.read_csv('web/static/non-english speakers/2016Census_G11D_NSW_POA.csv')
data_15_to_24_2016 = pd.read_csv('web/static/non-english speakers/2016Census_G11A_NSW_POA.csv')
data_35_to_44_2016 = pd.read_csv('web/static/non-english speakers/2016Census_G11B_NSW_POA.csv')
data_65_to_74_2016 = pd.read_csv('web/static/non-english speakers/2016Census_G11C_NSW_POA.csv')
population_data_2016 = pd.read_csv('web/static/non-english speakers/2016Census_G03_NSW_POA.csv')
total_data_2011 = pd.read_csv('web/static/non-english speakers/2011Census_B11A_NSW_POA_short.csv')
# https://github.com/Elkfox/Australian-Postcode-Data/blob/master/au_postcodes.csv
df_suburbs = pd.read_csv('web/static/non-english speakers/au_postcodes.csv')

# creating dataframe for suburb name data
df_suburbs_data = ps.sqldf(
    " SELECT postcode, place_name "
    + " FROM df_suburbs "
    + " WHERE postcode BETWEEN 2000 AND 2898"
)
# adding POA to beginning of postcodes to match census data
df_suburbs_data['POA_postcode'] = 'POA' + df_suburbs_data['postcode'].astype(str)
# joining all data into one file
language_df = ps.sqldf(
    "SELECT "
    + "t.POA_CODE_2016, "
    + "t.T_SOLSE_NWNAA_T, "
    + "a.A15_24_SOLSE_NWNAA_T, "
    + "b.A35_44_SOLSE_NWNAA_T, "
    + "c.A65_74_SOLSE_NWNAA_T, "
    + "p.Counted_home_Census_Night_Tot, "
    + "old.P_SOL_SE_NW_NA_Total "
    + "FROM total_data_2016 t "
    + "JOIN population_data_2016 p "
    + "ON t.POA_CODE_2016 = p.POA_CODE_2016 "
    + "JOIN data_15_to_24_2016 a "
    + "ON t.POA_CODE_2016 = a.POA_CODE_2016 "
    + "JOIN data_35_to_44_2016 b "
    + "ON t.POA_CODE_2016 = b.POA_CODE_2016 "
    + "JOIN data_65_to_74_2016 c "
    + "ON t.POA_CODE_2016 = c.POA_CODE_2016 "
    + "JOIN df_suburbs_data s "
    + "ON s.POA_postcode = t.POA_CODE_2016 "
    + "JOIN total_data_2011 old "
    + "ON old.region_ID = t.POA_CODE_2016 "
    + "GROUP BY t.POA_CODE_2016 "
)
# joining suburb data to census postcodes
df_combine_data = ps.sqldf(
    " SELECT s.POA_postcode, s.place_name "
    + " FROM df_suburbs_data s"
    + " JOIN language_df l"
    + " ON s.POA_postcode = l.POA_CODE_2016"
)
# getting string of suburb names for each postcode
suburbNameList = []
for index, row in language_df.iterrows():
    languagePostcode = row['POA_CODE_2016']
    postcodeSuburbsList = []
    for index, row in df_combine_data.iterrows():
        suburbPostcode = row['POA_postcode']
        suburbName = row['place_name']
        if(suburbPostcode == languagePostcode):
            postcodeSuburbsList.append(suburbName)
    postcodeSuburbs = ', '.join(postcodeSuburbsList)
    suburbNameList.append(postcodeSuburbs)

suburbNameListFull = [x for x in suburbNameList if x]
language_df['suburbs'] = suburbNameListFull

language_df.to_csv("web/static/non-english speakers/language_data_2016.csv")