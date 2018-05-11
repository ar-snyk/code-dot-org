require 'cdo/email_preference_constants'

class Api::V1::Pd::RegionalPartnerContactsController < Api::V1::Pd::FormsController
  def new_form
    @contact_form = ::Pd::RegionalPartnerContact.new
  end

  def on_successful_create
    EmailPreference.upsert(
      email: @contact_form.email,
      opt_in: @contact_form.opt_in?,
      ip_address: request.env['REMOTE_ADDR'],
      source: EmailPreferenceConstants::FORM_REGIONAL_PARTNER,
      form_kind: "0"
    )
  end
end
