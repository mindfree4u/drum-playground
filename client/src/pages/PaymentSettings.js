import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './PaymentSettings.css';

function PaymentSettings() {
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [newOption, setNewOption] = useState({ label: '', amount: '' });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', amount: '' });

  // 결제 옵션 불러오기
  const loadPaymentOptions = async () => {
    try {
      const q = query(collection(db, 'payment_settings'), orderBy('amount', 'asc'));
      const querySnapshot = await getDocs(q);

      
      const options = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPaymentOptions(options);
    } catch (error) {
      console.error('Error loading payment options:', error);
      setError('결제 옵션을 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    loadPaymentOptions();
  }, []);

  // 새 결제 옵션 추가
  const handleAddOption = async (e) => {
    e.preventDefault();
    
    if (!newOption.label || !newOption.amount) {
      setError('결제구분과 금액을 모두 입력해주세요.');
      return;
    }

    const amount = parseInt(newOption.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('유효한 금액을 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(db, 'payment_settings'), {
        label: newOption.label,
        amount: amount
      });
      
      setNewOption({ label: '', amount: '' });
      setError('');
      loadPaymentOptions();
    } catch (error) {
      console.error('Error adding payment option:', error);
      setError('결제 옵션 추가 중 오류가 발생했습니다.');
    }
  };

  // 결제 옵션 삭제
  const handleDeleteOption = async (id) => {
    if (!window.confirm('정말로 이 결제 옵션을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'payment_settings', id));
      loadPaymentOptions();
    } catch (error) {
      console.error('Error deleting payment option:', error);
      setError('결제 옵션 삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드 시작
  const handleStartEdit = (option) => {
    setEditingId(option.id);
    setEditForm({
      label: option.label,
      amount: option.amount.toString()
    });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ label: '', amount: '' });
  };

  // 결제 옵션 수정
  const handleUpdateOption = async (id) => {
    if (!editForm.label || !editForm.amount) {
      setError('결제구분과 금액을 모두 입력해주세요.');
      return;
    }

    const amount = parseInt(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('유효한 금액을 입력해주세요.');
      return;
    }

    try {
      await updateDoc(doc(db, 'payment_settings', id), {
        label: editForm.label,
        amount: amount
      });
      
      setEditingId(null);
      setEditForm({ label: '', amount: '' });
      setError('');
      loadPaymentOptions();
    } catch (error) {
      console.error('Error updating payment option:', error);
      setError('결제 옵션 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="payment-settings-container">
      <h2>결제비용 설정</h2>
      
      <form className="payment-settings-form" onSubmit={handleAddOption}>
        <div className="form-group">
          <input
            type="text"
            placeholder="결제구분"
            value={newOption.label}
            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
          />
          <input
            type="number"
            placeholder="금액"
            value={newOption.amount}
            onChange={(e) => setNewOption({ ...newOption, amount: e.target.value })}
          />
          <button type="submit">추가</button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </form>

      <div className="payment-options-list">
        <table>
          <thead>
            <tr>
              <th>결제구분</th>
              <th>금액</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {paymentOptions.map((option) => (
              <tr key={option.id}>
                <td>
                  {editingId === option.id ? (
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    />
                  ) : (
                    option.label
                  )}
                </td>
                <td>
                  {editingId === option.id ? (
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    />
                  ) : (
                    `${option.amount.toLocaleString()}원`
                  )}
                </td>
                <td className = "btn-select"    >
                  {editingId === option.id ? (
                    <>
                      <button 
                        className="save-button"
                        onClick={() => handleUpdateOption(option.id)}
                      >
                        저장
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={handleCancelEdit}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="edit-button"
                        onClick={() => handleStartEdit(option)}
                      >
                        수정
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteOption(option.id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentSettings; 