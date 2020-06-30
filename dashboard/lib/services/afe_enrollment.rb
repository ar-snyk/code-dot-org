#
# As part of our Amazon Future Engineer partnership, teachers at eligible
# schools may apply for a number of benefits by filling out a form on our
# website at code.org/afe.  Our system then submits the teacher's data and
# preferences to the AFE program, so that they can receive their benefits.
#
# We submit the teacher's data to a Pardot form handler set up by AFE which
# receives submissions in a custom format agreed upon in advance.  The form
# handler responds 200 OK whether the submission is accepted or not; we must
# read the response body to determine whether the submission has been
# successful.  This services wraps that whole process.
#
class Services::AFEEnrollment
  # Submit a teacher's information to the AFE Pardot form handler.
  #
  # @param traffic_source [String] Should always be AFE-code.org, for now
  # @param first_name [String] max 127 characters
  # @param last_name [String] max 127 characters
  # @param email [String] max 127 characters
  # @param nces_id [String] 12-digit school id
  # @param street_1 [String] Teacher's school's address, max 50 characters
  # @param street_2 [String] Teacher's school's address, max 30 characters
  # @param city [String] Teacher's school's city, max 50 characters
  # @param state [String] Teacher's school's state, 2 characters
  # @param zip [String] Teacher's school's postal code, 5 characters
  # @param marketing_kit [Boolean] Whether the teacher opted in to receiving AFE's marketing kit
  # @param csta_plus [Boolean] Whether the teacher opted in to a free CSTA Plus membership
  # @param aws_educate [Boolean] Whether the teacher opted in to a free AWS Educate membership
  # @param amazon_terms [Boolean] Whether the teacher agreed to AFE's privacy policy and terms
  #        of service.  Should always be true; we don't submit without this.
  # @param new_code_account [Boolean] Whether the teacher signed up for code.org as part of the
  #        AFE process.
  def submit(traffic_source:, first_name:, last_name:, email:, nces_id:,
    street_1:, street_2:, city:, state:, zip:, marketing_kit:, csta_plus:,
    aws_educate:, amazon_terms:, new_code_account:)
    return unless CDO.afe_pardot_form_handler_url

    raise 'AFE submission skipped: Terms and conditions were not accepted' unless amazon_terms

    response = Net::HTTP.post_form(
      URI(CDO.afe_pardot_form_handler_url),
      {
        'traffic-source' => traffic_source,
        'first-name' => first_name,
        'last-name' => last_name,
        'email' => email,
        'nces-id' => nces_id,
        'street-1' => street_1,
        'street-2' => street_2,
        'city' => city,
        'state' => state,
        'zip' => zip,
        'inspirational-marketing-kit' => booleanize(marketing_kit),
        'csta-plus' => booleanize(csta_plus),
        'aws-educate' => booleanize(aws_educate),
        'amazon-terms' => booleanize(amazon_terms),
        'new-code-account' => booleanize(new_code_account),
        'registration-date-time' => Time.now.iso8601
      }
    )

    raise "AFE submission failed with HTTP #{response.status}" unless response.status == 200
    raise "AFE submission failed with a validation error" if response.body =~ /Cannot find error page/
    nil
  end

  private

  def booleanize(val)
    ActiveModel::Type::Boolean.new.cast(val) ? '1' : '0'
  end
end
