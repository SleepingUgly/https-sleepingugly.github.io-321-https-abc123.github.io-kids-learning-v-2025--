# start.py
from flask import Flask, render_template, request

app = Flask(__name__)

# --- 體重轉換器核心邏輯 (獨立函數) ---
def get_weight_conversion_result(form_data=None):
    """處理體重轉換的邏輯，返回結果訊息"""
    output_message = "請輸入您的體重，按下「轉換」開始計算。"
    
    if form_data and form_data.get('weight'):
        try:
            weight_str = form_data.get('weight')
            unit_option = form_data.get('unit') 
            weight = float(weight_str)
            
            if weight <= 0:
                raise ValueError("體重必須大於零。")
                
            new_weight = None
            original_unit = ""
            new_unit_name = ""

            if unit_option == 'kg_to_lbs':
                new_weight = weight * 2.20462
                original_unit = '公斤 (kg)'
                new_unit_name = '磅 (lbs)'
            elif unit_option == 'lbs_to_kg':
                new_weight = weight / 2.20462
                original_unit = '磅 (lbs)'
                new_unit_name = '公斤 (kg)'
            elif unit_option == 'kg_to_g': 
                new_weight = weight * 1000
                original_unit = '公斤 (kg)'
                new_unit_name = '克 (g)'
            
            if new_weight is not None:
                output_message = f"""
                ---轉換開始---<br>
                原始重量：{weight:.2f} {original_unit}<br>
                轉換結果：您的體重是 **{new_weight:.2f}** {new_unit_name}<br>
                === 轉換完成 ===
                """
        
        except ValueError:
            output_message = "輸入錯誤：請輸入有效的、大於零的數字作為體重。"
        except Exception as e:
            output_message = f"發生未知錯誤：{e}"
    
    return output_message

# --- 主路由：渲染整合儀表板 ---
@app.route('/', methods=['GET', 'POST'])
def dashboard():
    # 處理體重轉換器提交
    weight_output = get_weight_conversion_result(request.form if request.method == 'POST' else None)
    
    # 固定訊息
    side_message = "這是我們一起開發的體重轉換器"
    
    # 關鍵：渲染 dashboard.html
    return render_template(
        'dashboard.html',
        weight_output=weight_output,
        side_message=side_message
    )

if __name__ == '__main__':
    app.run(debug=True)