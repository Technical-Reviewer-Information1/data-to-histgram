import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="度数分布表とヒストグラム作成アプリ", layout="wide")

st.title("度数分布表とヒストグラム作成アプリ")
st.caption("Created by Dit-Lab.(Daiki Ito)")
st.write("アップロードしたExcelやCSVデータから、度数分布表とヒストグラムを作成します。")
st.write("")

# ファイルアップローダー
uploaded_file = st.file_uploader('ファイルをアップロードしてください (Excel or CSV)', type=['xlsx', 'csv'])

# デモデータを使うかどうかのチェックボックス
use_demo_data = st.checkbox('デモデータを使用')

# データフレームの作成
df = None
if use_demo_data:
    df = pd.read_excel('hist_data.xlsx', sheet_name=0)
    st.write("デモデータを使用しています。")
    st.write(df.head())
elif uploaded_file is not None:
    if uploaded_file.type == 'text/csv':
        df = pd.read_csv(uploaded_file)
        st.write(df.head())
    else:
        df = pd.read_excel(uploaded_file)
        st.write(df.head())
else:
    st.write('ファイルをアップロードするか、デモデータを使用してください。')

if df is not None:
    # 数値変数のリストを取得
    numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    if numerical_cols:
        st.subheader('数値変数の選択')
        selected_col = st.selectbox('度数分布表とヒストグラムを作成する数値変数を選択してください', numerical_cols)
        
        # 度数分布表の作成
        st.subheader(f'度数分布表：{selected_col}')
        # ビンの数を選択
        bin_num = st.slider('ビンの数を選択してください', min_value=5, max_value=50, value=10)
        counts, bins = pd.cut(df[selected_col], bins=bin_num, retbins=True)
        freq_table = counts.value_counts().sort_index()
        freq_table = freq_table.reset_index()
        freq_table.columns = ['区間', '度数']
        st.write(freq_table)
        
        # ヒストグラムの作成
        st.subheader(f'ヒストグラム：{selected_col}')
        fig = px.histogram(df, x=selected_col, nbins=bin_num, title=f'ヒストグラム：{selected_col}')
        st.plotly_chart(fig)
    else:
        st.write('数値変数が含まれていません。')
