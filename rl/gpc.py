import os
import pandas as pd

# (?<=\S) (?=\S)
# \s

# ,0\n

"""
(?<=\S) (?=\S)
_

,
，

\s+
,

,\n
,0\n
"""

# Read the text file as a DataFrame
# df = pd.read_csv(os.path.join('data', 'BACnet', 'Energy_EM1.txt'))

csv_dir = os.path.join('data', 'csv')


def merge_all_devices_scv():
    df_arr = []

    for fn in os.listdir(csv_dir):
        device_name = fn.split('.')[0]

        # print(device_name)

        dfi = pd.read_csv(os.path.join(csv_dir, fn))

        dfi['device'] = device_name

        df_arr.append(dfi)

    # merge many dapaframe to one
    df_devices = pd.concat(df_arr)

    # print(df_devices.head())

    # save df to csv file, index=None means no index column, use proper encode for chinese column names
    df_devices.to_csv('All_device.csv', index=None, encoding='utf_8_sig')

# when read csv, set encode to utf_8_sig
# merge_all_devices_scv()

# df_devices = pd.read_csv(os.path.join('data', 'All_device.csv'), encoding='utf_8_sig')
# general_data = pd.read_csv(os.path.join('data', 'General.csv'))

df_devices = pd.read_csv(os.path.join('data', 'match_device.csv'), encoding='utf_8_sig')
df_gateway = pd.read_csv(os.path.join('data', 'match_gateway.csv'))

df_devices['对象名称'] = df_devices['对象名称'].str.replace(r'\s+', '', regex=True)
df_gateway['object-name-new'] = df_gateway['object-name-new'].str.replace(r'\s+', '', regex=True)

# df_devices.to_csv('df_devices.csv', index=None, encoding='utf_8_sig')
# df_gateway.to_csv('df_gateway.csv', index=None)

# print(general_data.head())

# joint two dataframe by key
# df_all = pd.merge(df_gateway, df_devices, left_on='object-name-new', right_on='对象名称')
df_all = pd.merge(df_devices, df_gateway, left_on='对象名称', right_on='object-name-new')

df_all = df_all.drop_duplicates(ignore_index=True)
print(df_all.shape)

df_all.to_csv('Matched2.csv', index=None, encoding='utf_8_sig')