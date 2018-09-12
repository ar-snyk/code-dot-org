# == Schema Information
#
# Table name: pd_applications
#
#  id                                  :integer          not null, primary key
#  user_id                             :integer
#  type                                :string(255)      not null
#  application_year                    :string(255)      not null
#  application_type                    :string(255)      not null
#  regional_partner_id                 :integer
#  status                              :string(255)
#  locked_at                           :datetime
#  notes                               :text(65535)
#  form_data                           :text(65535)      not null
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  course                              :string(255)
#  response_scores                     :text(65535)
#  application_guid                    :string(255)
#  decision_notification_email_sent_at :datetime
#  accepted_at                         :datetime
#  properties                          :text(65535)
#  deleted_at                          :datetime
#
# Indexes
#
#  index_pd_applications_on_application_guid     (application_guid)
#  index_pd_applications_on_application_type     (application_type)
#  index_pd_applications_on_application_year     (application_year)
#  index_pd_applications_on_course               (course)
#  index_pd_applications_on_regional_partner_id  (regional_partner_id)
#  index_pd_applications_on_status               (status)
#  index_pd_applications_on_type                 (type)
#  index_pd_applications_on_user_id              (user_id)
#

module Pd::Application
  class PrincipalApprovalApplicationBase < ApplicationBase
    include Pd::PrincipalApprovalCommonApplicationConstants

    # Implement in derived class.
    # @return a valid year (see ApplicationConstants.APPLICATION_YEARS)
    def year
      raise 'Abstract method must be overridden by inheriting class'
    end

    # @override
    def set_type_and_year
      self.application_type = PRINCIPAL_APPROVAL_APPLICATION
      self.application_year = year
    end

    def additional_text_fields
      [
        [:committed_to_master_schedule],
        [:replace_course, TEXT_FIELDS[:dont_know_explain], :replace_course_other],
        [:committed_to_diversity, TEXT_FIELDS[:other_please_explain], :committed_to_diversity_other],
        [:replace_which_course_csd, TEXT_FIELDS[:other_please_explain], :replace_which_course_csd_other],
        [:replace_which_course_csp, TEXT_FIELDS[:other_please_explain], :replace_which_course_csp_other],
        [:do_you_approve],
        [:going_to_teach]
      ]
    end

    def underrepresented_minority_percent
      sanitize_form_data_hash.select do |k, _|
        [
          :black,
          :hispanic,
          :pacific_islander,
          :american_indian
        ].include? k
      end.values.map(&:to_f).reduce(:+)
    end

    def placeholder?
      JSON.parse(form_data).empty?
    end
  end
end
