import {ApiError} from './api';
import {getLocale,translate} from './i18n';
import {w} from './copy';
export function depthError(error:unknown){
 if(error instanceof ApiError){const translated=translate(error.message);if(getLocale()==='fa'||translated!==error.message)return translated;
 if(error.status===403)return w('این بخش یا اقدام برای نقش شما مجاز نیست.','Your role cannot access this section or action.','لا يسمح دورك بهذا القسم أو الإجراء.','Rolünüz bu bölüme veya işleme erişemiyor.');
 if(error.status===409)return w('نسخه یا مرجع تغییر کرده است؛ اطلاعات را تازه و دوباره بررسی کنید.','The version or reference changed; refresh and review.','تغير الإصدار أو المرجع؛ حدّث المعلومات وراجعها.','Sürüm veya referans değişti; yenileyip inceleyin.');
 if(error.status===401)return w('نشست پایان یافته است؛ دوباره وارد شوید.','Your session expired; sign in again.','انتهت الجلسة؛ ادخل مجدداً.','Oturumunuz sona erdi; tekrar giriş yapın.');
 if(error.status===400)return w('ورودی یا مرجع معتبر نیست؛ حدود و فیلدهای فرم را بررسی کنید.','An input or reference is invalid; check form fields and limits.','المدخل أو المرجع غير صالح؛ تحقق من الحقول والحدود.','Girdi veya referans geçersiz; alanları ve sınırları kontrol edin.');}
 return w('دریافت یا ثبت تکمیل نشد؛ پس از اتصال، وضعیت را از سوابق بررسی کنید.','Loading or saving did not complete; check recorded state after reconnecting.','لم يكتمل التحميل أو الحفظ؛ تحقق من السجل بعد الاتصال.','Yükleme veya kayıt tamamlanmadı; bağlandıktan sonra kayıt durumunu kontrol edin.');
}
