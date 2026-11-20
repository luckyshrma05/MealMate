import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '../services/eventService';
import { getQuotationsByEvent } from '../services/quotationService';
import { ArrowLeft, FileText, Calendar, Users, Percent } from 'lucide-react';

export default function EventQuotation() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      try {
        const [evData, quoteData] = await Promise.all([
          getEventById(eventId),
          getQuotationsByEvent(eventId),
        ]);
        setEvent(evData.event || evData);
        setQuotations(Array.isArray(quoteData) ? quoteData : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Unable to load quotation details.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading quotation...</p>
      </div>
    );
  }

  const latestQuote = quotations[0];
  const totalCost = Number(latestQuote?.totalCost || latestQuote?.grandTotal || 0);
  const costPerGuest =
    event?.guestCount > 0 ? totalCost / event.guestCount : 0;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 px-8 py-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={28} />
              <div>
                <h2 className="text-2xl font-bold">{event?.name || 'Event Quotation'}</h2>
                <p className="text-blue-100 text-sm mt-1">Read-only catering cost quotation</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white border border-blue-400">
              Read Only
            </span>
          </div>

          <div className="p-8">
            {event && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 pb-6 border-b border-gray-100 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{new Date(event.eventDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span>{event.guestCount} Guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-gray-400" />
                  <span>{event.bufferPercent}% Buffer</span>
                </div>
              </div>
            )}

            {!latestQuote ? (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Quotation Not Ready Yet</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Once you finalize your menu, our catering team will generate your quotation here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Total Quotation Amount
                    </p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">
                      ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estimated Cost per Guest
                    </p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">
                      ₹{costPerGuest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {event?.eventDishes?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Selected Menu
                    </h3>
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                      {event.eventDishes.map((ed: any) => (
                        <div key={ed.dishId} className="flex justify-between items-center px-4 py-3 bg-white text-sm">
                          <span className="font-medium text-gray-900">{ed.dish?.name}</span>
                          <span className="text-gray-600">{ed.plannedServings} servings</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quotations.length > 1 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Previous Quotations</h3>
                    <div className="space-y-2">
                      {quotations.slice(1).map((q) => (
                        <div key={q.id} className="flex justify-between text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                          <span>Generated {new Date(q.createdAt).toLocaleDateString('en-IN')}</span>
                          <span className="font-medium text-gray-700">
                            ₹{Number(q.totalCost || q.grandTotal || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}